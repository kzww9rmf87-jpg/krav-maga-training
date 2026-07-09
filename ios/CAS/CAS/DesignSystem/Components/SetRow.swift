import SwiftUI

/// An editable load/reps row shown during execution — pre-filled with the
/// planned values, the athlete edits it to record what was actually done.
struct SetRow: View {
    let label: String?
    @Binding var load: String
    @Binding var reps: String

    var body: some View {
        HStack(spacing: 12) {
            if let label {
                Text(label)
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
                    .frame(width: 96, alignment: .leading)
            }
            TextField("Charge", text: $load)
                .textFieldStyle(.roundedBorder)
            Text("×")
                .foregroundStyle(CASTheme.Colors.secondaryText)
            TextField("Reps", text: $reps)
                .textFieldStyle(.roundedBorder)
        }
    }
}

#Preview {
    @Previewable @State var load = "80kg"
    @Previewable @State var reps = "5"
    return SetRow(label: "1 — Position 6-7", load: $load, reps: $reps)
        .padding()
}
