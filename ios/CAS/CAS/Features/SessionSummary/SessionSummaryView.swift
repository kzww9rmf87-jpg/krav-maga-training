import SwiftUI

struct SessionSummaryView: View {
    @State var viewModel: SessionSummaryViewModel
    var onDone: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Énergie avant séance") {
                    Picker("Énergie", selection: $viewModel.energyBefore) {
                        ForEach(1...5, id: \.self) { Text("\($0)").tag($0) }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Difficulté ressentie") {
                    Picker("Difficulté", selection: $viewModel.difficulty) {
                        ForEach(1...5, id: \.self) { Text("\($0)").tag($0) }
                    }
                    .pickerStyle(.segmented)
                }

                Section {
                    Toggle("Douleur", isOn: $viewModel.pain)
                    if viewModel.pain {
                        TextField("Où / quoi ?", text: $viewModel.painNote)
                    }
                }

                Section("Commentaire") {
                    TextField("Optionnel", text: $viewModel.comment, axis: .vertical)
                }

                if let error = viewModel.saveError {
                    Section {
                        Text(error)
                            .foregroundStyle(CASTheme.Colors.danger)
                    }
                }
            }
            .navigationTitle("Séance terminée")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Terminer") {
                        viewModel.save()
                        if viewModel.isSaved {
                            onDone()
                        }
                    }
                }
            }
        }
    }
}
