import SwiftUI

/// CHAUFFE / TRAVAIL / OPTION badge — mirrors the web prototype's Tag,
/// the only per-set visual distinction the app makes. 03_TYPOGRAPHY.md
/// classes labels under Medium (500) — Bold is reserved for primary
/// metrics and stays exceptional, so this uses `smallCaption` +
/// `.medium` rather than introducing an unnecessary Bold weight here.
///
/// `tint.opacity(0.15)` (the tinted badge background) has no dedicated
/// opacity token today — accepted as-is rather than inventing a token
/// category for a single use.
struct Tag: View {
    let kind: SetGroupKind

    private var typeScale = CASTypeScale()

    /// Explicit, not the synthesized memberwise init — see
    /// `PrimaryButton`'s identical `init` for why a `private` stored
    /// property (`typeScale`) requires this.
    init(kind: SetGroupKind) {
        self.kind = kind
    }

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
            .font(typeScale.smallCaption.weight(.medium))
            .foregroundStyle(tint)
            .padding(.horizontal, CASSpacing.xs)
            .padding(.vertical, CASSpacing.xxs)
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
