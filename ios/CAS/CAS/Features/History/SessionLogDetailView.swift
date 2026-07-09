import SwiftUI

struct SessionLogDetailView: View {
    let log: SessionLog

    var body: some View {
        List {
            Section {
                LabeledContent("Date", value: log.date.formatted(date: .abbreviated, time: .shortened))
                LabeledContent("Énergie avant séance", value: "\(log.energyBefore)/5")
                LabeledContent("Difficulté", value: "\(log.difficulty)/5")
                if log.pain {
                    LabeledContent("Douleur", value: log.painNote?.isEmpty == false ? log.painNote! : "Oui")
                }
                if let comment = log.comment, !comment.isEmpty {
                    LabeledContent("Commentaire", value: comment)
                }
            }

            if !log.sets.isEmpty {
                Section("Séries") {
                    ForEach(log.sets) { set in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(set.exerciseName)
                                .font(CASTypography.body.weight(.semibold))
                            Text("\(set.actualLoad) × \(set.actualReps)")
                                .font(CASTypography.caption)
                                .foregroundStyle(CASTheme.Colors.secondaryText)
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        }
        .navigationTitle(log.sessionTitle)
    }
}
