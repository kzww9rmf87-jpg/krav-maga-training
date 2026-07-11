import Foundation

/// A prescribed or performed load. Hybrid on purpose: some exercises have
/// a real number (a loaded barbell), some are relative to an unknown
/// bodyweight, some are deliberately qualitative (there is no kg value
/// for "Lourd"), and some don't fit any of that and stay free text.
///
/// Volume, personal records and automatic progression (Alpha 1.1) only
/// activate on the cases that carry a real, comparable number —
/// `.qualitative` and `.custom` never get auto-converted into one. See
/// `volumeContribution` and `progressionAnchor`.
enum LoadValue: Hashable, Sendable {
    case weighted(value: Double, unit: MassUnit)
    case bodyweight
    case bodyweightAdded(value: Double, unit: MassUnit)
    case bodyweightAssisted(value: Double, unit: MassUnit)
    case qualitative(QualitativeLevel)
    case custom(String)
}

enum MassUnit: String, Hashable, Sendable, CaseIterable {
    case kg
    case lb

    /// Exact, standard conversion (1 lb = 0.45359237 kg) — used only to
    /// combine weighted loads into one total for volume/progression
    /// display. Not a physiological claim, just arithmetic.
    var kilogramsPerUnit: Double {
        switch self {
        case .kg: return 1
        case .lb: return 0.45359237
        }
    }
}

enum QualitativeLevel: String, Hashable, Sendable, CaseIterable {
    case light
    case moderate
    case heavy
    case maxHold

    var displayName: String {
        switch self {
        case .light: return "Léger"
        case .moderate: return "Modéré"
        case .heavy: return "Lourd"
        case .maxHold: return "Tenue max"
        }
    }
}

extension LoadValue {
    var displayText: String {
        switch self {
        case .weighted(let value, let unit):
            return "\(Self.format(value)) \(unit.rawValue)"
        case .bodyweight:
            return "Poids de corps"
        case .bodyweightAdded(let value, let unit):
            return "Poids de corps +\(Self.format(value)) \(unit.rawValue)"
        case .bodyweightAssisted(let value, let unit):
            return "Poids de corps -\(Self.format(value)) \(unit.rawValue) (assisté)"
        case .qualitative(let level):
            return level.displayName
        case .custom(let text):
            return text
        }
    }

    private static func format(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0
            ? String(format: "%.0f", value)
            : String(format: "%.1f", value).replacingOccurrences(of: ".", with: ",")
    }
}

extension LoadValue {
    /// The number volume math can use directly — only a real, absolute
    /// load. `.bodyweightAdded`/`.bodyweightAssisted` are relative to an
    /// athlete's bodyweight CAS doesn't track (no athlete profile), so
    /// they can't honestly contribute to a total volume figure; plain
    /// `.bodyweight` obviously can't either.
    var volumeContribution: (value: Double, unit: MassUnit)? {
        guard case .weighted(let value, let unit) = self else { return nil }
        return (value, unit)
    }

    /// The number progression math can compare session to session — a
    /// wider set than `volumeContribution`, because "the added weight
    /// went up" or "the assistance went down" are meaningful progression
    /// signals even without knowing total bodyweight.
    var progressionAnchor: (value: Double, unit: MassUnit)? {
        switch self {
        case .weighted(let value, let unit): return (value, unit)
        case .bodyweightAdded(let value, let unit): return (value, unit)
        case .bodyweightAssisted(let value, let unit): return (value, unit)
        case .bodyweight, .qualitative, .custom: return nil
        }
    }
}

extension LoadValue {
    /// Compact string form for persistence — deliberately not JSON, so
    /// `SetLog`'s stored column can stay a plain `String` with no
    /// SwiftData schema/migration change (see `SetLog.swift`). Never
    /// ambiguous with real historical data: nothing a person would type
    /// as a charge starts with `w:`, `bw`, `bw+:`, `bw-:` or `q:`.
    var encoded: String {
        switch self {
        case .weighted(let value, let unit): return "w:\(value):\(unit.rawValue)"
        case .bodyweight: return "bw"
        case .bodyweightAdded(let value, let unit): return "bw+:\(value):\(unit.rawValue)"
        case .bodyweightAssisted(let value, let unit): return "bw-:\(value):\(unit.rawValue)"
        case .qualitative(let level): return "q:\(level.rawValue)"
        case .custom(let text): return "c:\(text)"
        }
    }

    /// Backward-compatible decode. Anything that doesn't match one of
    /// `encoded`'s exact prefixes — including every `SetSpec`/`SetLog`
    /// value written before this type existed ("75kg", "Lourd", "—") —
    /// becomes `.custom(text:)` verbatim. Never reinterpreted as a
    /// number: that would be exactly the "auto-parse free text into a
    /// precise-looking calculation" this type exists to avoid.
    init(decoding raw: String) {
        let parts = raw.split(separator: ":", maxSplits: 2, omittingEmptySubsequences: false).map(String.init)
        switch parts.first {
        case "w" where parts.count == 3:
            if let value = Double(parts[1]), let unit = MassUnit(rawValue: parts[2]) {
                self = .weighted(value: value, unit: unit)
                return
            }
        case "bw" where parts.count == 1:
            self = .bodyweight
            return
        case "bw+" where parts.count == 3:
            if let value = Double(parts[1]), let unit = MassUnit(rawValue: parts[2]) {
                self = .bodyweightAdded(value: value, unit: unit)
                return
            }
        case "bw-" where parts.count == 3:
            if let value = Double(parts[1]), let unit = MassUnit(rawValue: parts[2]) {
                self = .bodyweightAssisted(value: value, unit: unit)
                return
            }
        case "q" where parts.count == 2:
            if let level = QualitativeLevel(rawValue: parts[1]) {
                self = .qualitative(level)
                return
            }
        case "c" where parts.count >= 2:
            self = .custom(parts[1...].joined(separator: ":"))
            return
        default:
            break
        }
        self = .custom(raw)
    }
}

extension LoadValue: Codable {
    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self.init(decoding: raw)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(encoded)
    }
}
