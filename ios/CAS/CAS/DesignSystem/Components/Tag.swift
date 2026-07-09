import SwiftUI

/// CHAUFFE / TRAVAIL / OPTION badge — mirrors the web prototype's Tag,
/// the only per-set visual distinction the app makes.
struct Tag: View {
    let kind: SetGroupKind

    private var label: String {
        switch kind {
        case .warmup: return "CHAUFFE"
        case .work: return "TRAVAIL"
        case .option: return "OPTION"
        }
    }

    private var tint: Color {
        switch kind {
        case .warmup: return CASTheme.Colors.secondaryText
        case .work: return CASTheme.Colors.primary
        case .option: return CASTheme.Colors.warning
        }
    }

    var body: some View {
        Text(label)
            .font(.caption2.weight(.bold))
            .foregroundStyle(tint)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(tint.opacity(0.15), in: Capsule())
    }
}

#Preview {
    HStack {
        Tag(kind: .warmup)
        Tag(kind: .work)
        Tag(kind: .option)
    }
}
