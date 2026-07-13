import SwiftUI

struct SessionLogDetailView: View {
    let log: SessionLog

    private var typeScale = CASTypeScale()

    /// Explicit, not the synthesized memberwise init: a `private`
    /// stored property (`typeScale`) would otherwise make the
    /// compiler-generated initializer inaccessible from
    /// `HistoryView.swift`, which instantiates this type.
    init(log: SessionLog) {
        self.log = log
    }

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
                        VStack(alignment: .leading, spacing: CASSpacing.xxs) {
                            Text(set.exerciseName)
                                .font(typeScale.body.weight(.semibold))
                            Text("\(set.actualLoadValue.displayText) × \(set.actualReps)")
                                .font(typeScale.caption)
                                .foregroundStyle(CASTheme.Colors.secondaryText)
                        }
                        .padding(.vertical, CASSpacing.xxs)
                    }
                }
            }
        }
        .navigationTitle(log.sessionTitle)
    }
}
