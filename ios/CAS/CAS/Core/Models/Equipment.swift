import Foundation

/// One piece of equipment an athlete can declare access to. Flat and
/// exhaustive-for-now rather than hierarchical — nothing downstream
/// consumes this yet (no exercise selection exists in Beta 1.0), so
/// grouping/categorizing it further now would be guessing at a shape
/// before there's a real consumer to shape it around.
///
/// Raw values are the default (case name, no explicit string literal) —
/// none contain a comma, which the future SwiftData bridge relies on for
/// its comma-joined encoding of `Set<Equipment>`.
enum Equipment: String, Codable, CaseIterable, Sendable {
    case pullUpBar
    case dipBars
    case resistanceBands
    case dumbbells
    case barbell
    case rack
    case bench
    case cableMachine
    case kettlebell
    case medicineBall
    case sled
    case heavyBag
    case cardioMachine
}
