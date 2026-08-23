"""Section 8/9 exemption precedent table.

Precedent citation is a legally load-bearing fact, so matching is
deterministic keyword detection against a denial's evidence_excerpt — the
same rule as everywhere else in this build: the model drafts, it never
decides what gets cited (see §9.3 of the build spec). A handful of entries
below cite real, well-known judgments; the rest are marked "(illustrative)"
because they stand in for a category of CIC decisions rather than a single
verified case. Either way, treat this table as demo-ready, not
courtroom-ready — it needs a lawyer's sign-off before any production use,
exactly as docs/engineering/CODEX_BUILD_SPEC.md §12 Task 12 flags.
"""

from __future__ import annotations

import dataclasses


@dataclasses.dataclass(frozen=True)
class Precedent:
    section: str
    principle: str
    citation: str
    keywords: tuple[str, ...]


PRECEDENTS: tuple[Precedent, ...] = (
    Precedent(
        section="Section 8(1)(a)",
        principle=(
            "An exemption for sovereignty, security, or strategic interests must attach to "
            "the specific information withheld, not be invoked as a blanket category."
        ),
        citation="CIC, In re security-classified infrastructure records (illustrative)",
        keywords=("national security", "sovereignty", "strategic interest", "8(1)(a)"),
    ),
    Precedent(
        section="Section 8(1)(b)",
        principle=(
            "Information whose publication is expressly forbidden by a court or tribunal, or "
            "would amount to contempt, is exempt only for as long as that bar remains in force."
        ),
        citation="CIC, In re sub judice records (illustrative)",
        keywords=("contempt of court", "sub judice", "8(1)(b)"),
    ),
    Precedent(
        section="Section 8(1)(d)",
        principle=(
            "Commercial confidence or trade secrets are exempt only where disclosure would "
            "harm the third party's competitive position, and the exemption yields to a "
            "demonstrated larger public interest."
        ),
        citation="RBI v. Jayantilal N. Mistry, (2016) 3 SCC 525",
        keywords=("commercial confidence", "trade secret", "competitive position", "8(1)(d)"),
    ),
    Precedent(
        section="Section 8(1)(e)",
        principle=(
            "Information held in a fiduciary relationship is exempt unless the competent "
            "authority is satisfied a larger public interest warrants disclosure."
        ),
        citation="CIC, In re fiduciary-relationship records (illustrative)",
        keywords=("fiduciary", "8(1)(e)"),
    ),
    Precedent(
        section="Section 8(1)(g)",
        principle=(
            "Information that would endanger the life or physical safety of a person, or "
            "identify a source given in confidence for law enforcement, is exempt."
        ),
        citation="CIC, In re informant-identity records (illustrative)",
        keywords=("endanger life", "physical safety", "informant", "8(1)(g)"),
    ),
    Precedent(
        section="Section 8(1)(h)",
        principle=(
            "Information that would impede the investigation, apprehension, or prosecution of "
            "offenders is exempt only while that process is genuinely ongoing — it lapses once "
            "the investigation concludes."
        ),
        citation="CIC, In re pending-investigation records (illustrative)",
        keywords=("impede investigation", "ongoing investigation", "prosecution", "8(1)(h)"),
    ),
    Precedent(
        section="Section 8(1)(i)",
        principle=(
            "Cabinet papers, including records of Council of Ministers deliberations, are "
            "exempt only until the decision is final and the matter is complete or over."
        ),
        citation="CIC, In re cabinet-deliberation records (illustrative)",
        keywords=("cabinet paper", "council of ministers", "8(1)(i)"),
    ),
    Precedent(
        section="Section 8(1)(j)",
        principle=(
            "Personal information with no relationship to any public activity or interest, or "
            "whose disclosure would cause an unwarranted invasion of privacy, is exempt unless "
            "a larger public interest justifies disclosure."
        ),
        citation="Girish Ramchandra Deshpande v. CIC, (2013) 1 SCC 212",
        keywords=("personal information", "invasion of privacy", "8(1)(j)"),
    ),
    Precedent(
        section="Section 9",
        principle=(
            "A third party's copyright may justify withholding the protected expression, but "
            "the exemption is narrower than a general confidentiality claim and does not reach "
            "the underlying facts."
        ),
        citation="CIC, In re copyrighted-material records (illustrative)",
        keywords=("copyright", "section 9 exemption"),
    ),
    Precedent(
        section="Section 8(1) proviso",
        principle=(
            "Even where a Section 8(1) exemption otherwise applies, information cannot be "
            "denied to a citizen if Parliament or a State Legislature would not be denied "
            "access to it."
        ),
        citation="CBSE v. Aditya Bandopadhyay, (2011) 8 SCC 497",
        keywords=(
            "parliament",
            "legislature",
            "public interest override",
            "larger public interest",
        ),
    ),
)


def match_precedents(text: str | None) -> list[Precedent]:
    if not text:
        return []
    haystack = text.lower()
    return [
        precedent
        for precedent in PRECEDENTS
        if any(keyword in haystack for keyword in precedent.keywords)
    ]
