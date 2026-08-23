from __future__ import annotations

from app.domain.appeal_engine.precedents import match_precedents


def test_match_precedents_finds_entry_by_section_number():
    matches = match_precedents("The request was denied under Section 8(1)(j) of the Act.")

    assert len(matches) == 1
    assert matches[0].section == "Section 8(1)(j)"


def test_match_precedents_finds_entry_by_keyword_phrase():
    matches = match_precedents(
        "Disclosure would harm the vendor's competitive position and reveal trade secret pricing."
    )

    assert any(p.section == "Section 8(1)(d)" for p in matches)


def test_match_precedents_returns_empty_for_unrelated_text():
    matches = match_precedents("The work order was issued on 4 March 2025.")

    assert matches == []


def test_match_precedents_handles_none():
    assert match_precedents(None) == []
