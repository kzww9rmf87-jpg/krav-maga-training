import SwiftUI

/// An editable load/reps row shown during execution — pre-filled with the
/// planned values, the athlete edits it to record what was actually done.
///
/// The load control adapts to the `LoadValue` case (Alpha 1.1): a numeric
/// field with a unit for weighted/bodyweight-relative loads, a compact
/// picker for qualitative levels, a plain label for pure bodyweight (there
/// is nothing to type), free text for anything custom. The case itself
/// never changes here — a set planned as "Lourd" stays qualitative even
/// after editing; there's no auto-upgrade to a number.
///
/// `frame(width: 96)` (the label column) and `.textFieldStyle(.roundedBorder)`
/// (native corner radius, independent of `CASRadius`) are accepted
/// exceptions — no token covers a fixed layout column width or a native
/// control style's internal radius.
struct SetRow: View {
    let label: String?
    @Binding var load: LoadValue
    @Binding var reps: String

    private var typeScale = CASTypeScale()

    /// Explicit, not the synthesized memberwise init — see
    /// `PrimaryButton`'s identical `init` for why a `private` stored
    /// property (`typeScale`) requires this.
    init(label: String?, load: Binding<LoadValue>, reps: Binding<String>) {
        self.label = label
        self._load = load
        self._reps = reps
    }

    var body: some View {
        HStack(spacing: CASSpacing.s) {
            if let label {
                Text(label)
                    .font(typeScale.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
                    .frame(width: 96, alignment: .leading)
            }
            loadField
            Text("×")
                .foregroundStyle(CASTheme.Colors.secondaryText)
            TextField("Reps", text: $reps)
                .textFieldStyle(.roundedBorder)
        }
    }

    @ViewBuilder
    private var loadField: some View {
        switch load {
        case .weighted(let value, let unit):
            numericField(value: value, unit: unit) { .weighted(value: $0, unit: $1) }
        case .bodyweightAdded(let value, let unit):
            numericField(value: value, unit: unit) { .bodyweightAdded(value: $0, unit: $1) }
        case .bodyweightAssisted(let value, let unit):
            numericField(value: value, unit: unit) { .bodyweightAssisted(value: $0, unit: $1) }
        case .bodyweight:
            Text("Poids de corps")
                .font(typeScale.body)
                .foregroundStyle(CASTheme.Colors.secondaryText)
                .frame(maxWidth: .infinity, alignment: .leading)
        case .qualitative(let level):
            Picker(
                "Charge",
                selection: Binding(get: { level }, set: { load = .qualitative($0) })
            ) {
                ForEach(QualitativeLevel.allCases, id: \.self) { level in
                    Text(level.displayName).tag(level)
                }
            }
            .pickerStyle(.menu)
        case .custom(let text):
            TextField("Charge", text: Binding(get: { text }, set: { load = .custom($0) }))
                .textFieldStyle(.roundedBorder)
        }
    }

    private func numericField(
        value: Double,
        unit: MassUnit,
        make: @escaping (Double, MassUnit) -> LoadValue
    ) -> some View {
        HStack(spacing: CASSpacing.xxs) {
            TextField(
                "Charge",
                value: Binding(get: { value }, set: { load = make($0, unit) }),
                format: .number
            )
            .keyboardType(.decimalPad)
            .textFieldStyle(.roundedBorder)
            Text(unit.rawValue)
                .font(typeScale.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
        }
    }
}

#Preview {
    @Previewable @State var load = LoadValue.weighted(value: 80, unit: .kg)
    @Previewable @State var reps = "5"
    return SetRow(label: "1 — Position 6-7", load: $load, reps: $reps)
        .padding()
}
