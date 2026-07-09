import SwiftData
import SwiftUI

@main
struct CASApp: App {
    var body: some Scene {
        WindowGroup {
            HomeView()
        }
        .modelContainer(PersistenceController.makeContainer())
    }
}
