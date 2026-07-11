import SwiftUI

struct SessionSummaryView: View {
    @State var viewModel: SessionSummaryViewModel
    var onDone: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Bilan") {
                    LabeledContent("Durée", value: Self.formattedDuration(viewModel.elapsedSeconds))
                    LabeledContent("Exercices", value: "\(viewModel.recap.exerciseCount)")
                    LabeledContent("Séries", value: "\(viewModel.recap.setCount)")
                    LabeledContent("Répétitions", value: "\(viewModel.recap.totalReps)")
                    if let volumeKg = viewModel.recap.volumeKg {
                        LabeledContent("Volume", value: "\(Int(volumeKg.rounded())) kg")
                    }
                }

                if !viewModel.recap.personalRecords.isEmpty {
                    Section("Records battus") {
                        ForEach(viewModel.recap.personalRecords, id: \.exerciseName) { record in
                            LabeledContent(record.exerciseName, value: record.newBest.displayText)
                        }
                    }
                }

                if !viewModel.recap.progressionSuggestions.isEmpty {
                    Section("Pour la prochaine fois") {
                        ForEach(viewModel.recap.progressionSuggestions, id: \.exerciseName) { item in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.exerciseName)
                                    .font(CASTypography.body.weight(.semibold))
                                Text(item.suggestion.displayText)
                                    .font(CASTypography.caption)
                                    .foregroundStyle(CASTheme.Colors.secondaryText)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                }

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

    /// "42 min" under an hour, "1 h 05" at or above one hour.
    private static func formattedDuration(_ seconds: Int) -> String {
        let minutes = seconds / 60
        guard minutes >= 60 else { return "\(minutes) min" }
        let hours = minutes / 60
        let remainder = minutes % 60
        return remainder == 0 ? "\(hours) h" : "\(hours) h \(String(format: "%02d", remainder))"
    }
}
