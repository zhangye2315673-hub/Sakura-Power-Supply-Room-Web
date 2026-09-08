import "./modulepreload-polyfill-BsPm7yBB.js";
import { a as renderSkillCardSymbol, i as getSkillCardStyle, r as getSkillCardPreviewDefinitions } from "./SkillCardPresentation-a3SX2Cg4.js";
//#region src/review/gachaCardPreview.ts
var POLARITY_META = {
	positive: {
		title: "正向技能",
		badge: "正向技能"
	},
	negative: {
		title: "负向技能",
		badge: "负向技能"
	},
	mixed: {
		title: "混合技能",
		badge: "混合技能"
	}
};
var skillCards = getSkillCardPreviewDefinitions();
function renderCard(card) {
	const longTitle = card.label.length >= 8 ? " is-long-title" : "";
	const longCopy = card.description.length >= 30 ? " is-long-copy" : "";
	return `
    <button
      class="gacha-preview-card gacha-preview-card--gallery gacha-preview-card--${card.polarity} is-flipped"
      type="button"
      aria-label="${card.applianceLabel}，${card.label}。点击查看卡背"
      style="${getSkillCardStyle(card.skillId)}"
    >
      <span class="gacha-preview-card__inner">
        <span class="gacha-preview-card__face gacha-preview-card__back">
          <span class="gacha-preview-card__frame">
            <span class="gacha-preview-card__inset gacha-preview-card__back-inset">
              <span class="gacha-preview-card__random">随机</span>
              <strong class="gacha-preview-card__question">?</strong>
            </span>
          </span>
        </span>
        <span class="gacha-preview-card__face gacha-preview-card__front">
          <span class="gacha-preview-card__frame">
            <span class="gacha-preview-card__inset gacha-preview-card__front-inset">
              <span class="gacha-preview-card__appliance">${card.applianceLabel}</span>
              <strong class="gacha-preview-card__skill${longTitle}" title="${card.label}">${card.label}</strong>
              <span class="gacha-preview-card__icon-shell" role="img" aria-label="${card.label}技能符号">
                <span class="skill-card-symbol-stage">${renderSkillCardSymbol(card.skillId)}</span>
              </span>
              <span class="gacha-preview-card__badge">${POLARITY_META[card.polarity].badge}</span>
              <small class="gacha-preview-card__description${longCopy}">${card.description}</small>
            </span>
          </span>
        </span>
      </span>
    </button>`;
}
var gallery = document.querySelector("#skill-card-gallery");
if (!gallery) throw new Error("Missing skill card gallery");
[
	"positive",
	"negative",
	"mixed"
].forEach((polarity) => {
	const cards = skillCards.filter((card) => card.polarity === polarity);
	const section = document.createElement("section");
	section.className = `skill-card-group skill-card-group--${polarity}`;
	section.innerHTML = `
    <header class="skill-card-group__heading">
      <div><span>${polarity.toUpperCase()}</span><h2>${POLARITY_META[polarity].title}</h2></div>
      <strong>${cards.length}</strong>
    </header>
    <div class="skill-card-grid">${cards.map(renderCard).join("")}</div>`;
	gallery.append(section);
});
document.querySelector("#skill-card-total").textContent = String(skillCards.length);
document.querySelectorAll(".gacha-preview-card").forEach((card) => {
	card.addEventListener("click", () => {
		card.classList.toggle("is-flipped");
		card.setAttribute("aria-label", card.classList.contains("is-flipped") ? "点击查看卡背" : "点击查看技能卡面");
	});
});
window.__GACHA_CARD_PREVIEW_READY__ = true;
//#endregion
