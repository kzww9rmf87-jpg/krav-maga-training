import SwiftData
import SwiftUI

@main
struct CASApp: App {
    var body: some Scene {
        WindowGroup {
            Text("CAS")
        }
        .modelContainer(PersistenceController.makeContainer())
    }
}
