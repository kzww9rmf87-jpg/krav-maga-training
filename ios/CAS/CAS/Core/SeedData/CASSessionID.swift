import Foundation

/// CAS V0.1's five stable session identifiers (Sprint 3) — the app's
/// primary content, replacing the legacy A/B/C/D/Bras rotation. See
/// `LegacySessionID` for why this is a separate type rather than added
/// cases on one shared enum: once legacy sessions exist but must never
/// rotate, `CaseIterable.allCases` can no longer double as "the rotation
/// order" for a single mixed enum. Splitting keeps that property for the
/// set that actually needs it.
///
/// Declaration order is the rotation order, exactly as the user specified
/// it: Force → Puissance → Hypertrophie fonctionnelle → Robustesse →
/// Base aérobie → (wraps to Force).
enum CASSessionID: String, CaseIterable, Sendable {
    case force = "cas-force"
    case power = "cas-puissance"
    case functionalHypertrophy = "cas-hypertrophie"
    case robustness = "cas-robustesse"
    case aerobicBase = "cas-base-aerobie"
}
