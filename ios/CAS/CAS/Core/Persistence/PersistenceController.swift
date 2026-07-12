import Foundation
import SwiftData

/// Builds the app's `ModelContainer`. The schema holds the realized-history
/// models (`SessionLog`, `SetLog`) — the training plan itself
/// (`TrainingSession`, `Exercise`...) is static seed data, not persisted,
/// per Sprint 1's scope — plus, since Beta 1.0, `AthleteProfileRecord`.
enum PersistenceController {
    static func makeContainer(inMemory: Bool = false) -> ModelContainer {
        let schema = Schema([SessionLog.self, SetLog.self, AthleteProfileRecord.self])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: inMemory)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Failed to create the CAS ModelContainer: \(error)")
        }
    }
}
