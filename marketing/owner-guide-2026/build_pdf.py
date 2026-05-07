#!/usr/bin/env python3
"""
Build the Bridgepointe Crew Portal Owner's Guide PDF.

Stitches together four markdown sections into a single branded PDF using
ReportLab. Brand: dark cream paper, deep ink-black text, gold rules, serif
headings (Times for body, Helvetica-Bold for accents — system-built fonts so
the PDF travels everywhere).
"""
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import HRFlowable

# ─── Brand ──────────────────────────────────────────────────────────────────

GOLD = colors.HexColor("#b8956a")
GOLD_DARK = colors.HexColor("#9a7a54")
INK = colors.HexColor("#1a1a1a")
INK_SOFT = colors.HexColor("#3a3530")
INK_MUTE = colors.HexColor("#7a7268")
PAPER = colors.HexColor("#fcfaf6")
RULE = colors.HexColor("#e7dfd1")
CALLOUT_BG = colors.HexColor("#f4ede0")

PAGE_W, PAGE_H = LETTER
MARGIN_X = 0.85 * inch
MARGIN_TOP = 1.05 * inch
MARGIN_BOTTOM = 0.95 * inch

ROOT = Path(__file__).resolve().parent
SECTIONS_DIR = ROOT / "sections"
OUTPUT = ROOT / "Bridgepointe-Crew-Portal-Owner-Guide.pdf"

SECTIONS = [
    ("01-business-case.md",  "I",   "The Business Case",      "Why this exists, what it solves, and what it returns."),
    ("02-admin-manual.md",   "II",  "Admin Operating Manual", "How to add crew, issue logins, and run the portal."),
    ("03-crew-guide.md",     "III", "Crew User Guide",        "What employees and subs see — and how to brief them."),
    ("04-reference.md",      "IV",  "Reference & Troubleshooting", "Architecture, security, FAQ, and recovery."),
]

# ─── Styles ─────────────────────────────────────────────────────────────────

base = getSampleStyleSheet()

def style(name, **kw):
    p = ParagraphStyle(name, parent=base["Normal"])
    for k, v in kw.items():
        setattr(p, k, v)
    return p

S_BODY = style("body", fontName="Times-Roman", fontSize=10.5, leading=15.5,
               textColor=INK, alignment=TA_JUSTIFY, spaceAfter=8)
S_BODY_LEFT = style("bodyL", parent_=S_BODY, fontName="Times-Roman", fontSize=10.5,
                    leading=15.5, textColor=INK, alignment=TA_LEFT, spaceAfter=8)
S_LEAD = style("lead", fontName="Times-Italic", fontSize=11.5, leading=17,
               textColor=INK_SOFT, alignment=TA_LEFT, spaceAfter=12)

S_H1 = style("h1", fontName="Times-Bold", fontSize=22, leading=26,
             textColor=INK, spaceBefore=0, spaceAfter=6, alignment=TA_LEFT)
S_H2 = style("h2", fontName="Times-Bold", fontSize=15, leading=20,
             textColor=INK, spaceBefore=18, spaceAfter=4, alignment=TA_LEFT, keepWithNext=1)
S_H3 = style("h3", fontName="Times-Bold", fontSize=12, leading=16,
             textColor=GOLD_DARK, spaceBefore=12, spaceAfter=2, alignment=TA_LEFT, keepWithNext=1)
S_H4 = style("h4", fontName="Helvetica-Bold", fontSize=9.5, leading=13,
             textColor=GOLD_DARK, spaceBefore=10, spaceAfter=2,
             alignment=TA_LEFT, keepWithNext=1)

S_EYEBROW = style("eyebrow", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
                  textColor=GOLD, alignment=TA_LEFT, spaceAfter=2)
S_BULLET = style("bullet", parent_=S_BODY, fontName="Times-Roman", fontSize=10.5,
                 leading=15, textColor=INK, alignment=TA_LEFT,
                 leftIndent=18, bulletIndent=4, spaceAfter=4)
S_NUMBER = style("number", parent_=S_BULLET, leftIndent=24, bulletIndent=6)

S_QUOTE = style("quote", fontName="Times-Italic", fontSize=10.5, leading=15.5,
                textColor=INK_SOFT, leftIndent=14, rightIndent=10,
                spaceBefore=6, spaceAfter=10, alignment=TA_LEFT)

S_CODE_INLINE = "code"

S_TOC_TITLE = style("toc_title", fontName="Times-Bold", fontSize=11.5, leading=16,
                    textColor=INK, alignment=TA_LEFT)
S_TOC_DESC = style("toc_desc", fontName="Times-Italic", fontSize=10, leading=14,
                   textColor=INK_MUTE, alignment=TA_LEFT, spaceAfter=14)
S_TOC_NUM = style("toc_num", fontName="Helvetica-Bold", fontSize=11, leading=16,
                  textColor=GOLD, alignment=TA_LEFT)
S_TOC_PAGE = style("toc_page", fontName="Helvetica-Bold", fontSize=10.5, leading=16,
                   textColor=GOLD_DARK, alignment="RIGHT")

S_COVER_BRAND = style("c_brand", fontName="Times-Bold", fontSize=42, leading=46,
                      textColor=INK, alignment=TA_CENTER)
S_COVER_EYEBROW = style("c_eyebrow", fontName="Helvetica-Bold", fontSize=10, leading=14,
                        textColor=GOLD, alignment=TA_CENTER)
S_COVER_TITLE = style("c_title", fontName="Times-Bold", fontSize=28, leading=34,
                      textColor=INK, alignment=TA_CENTER)
S_COVER_SUB = style("c_sub", fontName="Times-Italic", fontSize=14, leading=20,
                    textColor=INK_SOFT, alignment=TA_CENTER)
S_COVER_FOOT = style("c_foot", fontName="Helvetica", fontSize=9, leading=13,
                     textColor=INK_MUTE, alignment=TA_CENTER)


# ─── Inline markdown → ReportLab markup ─────────────────────────────────────

def inline(text: str) -> str:
    """Convert a single line of markdown inline syntax to RL paragraph markup."""
    s = text
    # Escape XML/HTML-ish chars first.
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Code spans — keep first so other formatters don't touch them
    s = re.sub(r"`([^`]+)`",
               lambda m: f'<font name="Courier" size="9.5" color="#5c4a32">{m.group(1)}</font>',
               s)
    # Bold (**text**)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    # Italic (*text*) — but not the leftover ** — handle after bold by ensuring no **
    s = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<i>\1</i>", s)
    # Em-dashes already em-dashes; render typographic
    s = s.replace("--", "—")
    return s


# ─── Markdown → flowables ──────────────────────────────────────────────────

def parse_section(md: str, section_num: str, section_title: str):
    """Return a list of Platypus flowables for one section."""
    flows = [
        Paragraph(f"SECTION {section_num}", S_EYEBROW),
        HRFlowable(width="100%", thickness=1.5, color=GOLD,
                   spaceBefore=2, spaceAfter=12),
        Paragraph(section_title, S_H1),
        Spacer(1, 14),
    ]

    lines = md.split("\n")
    i = 0
    n = len(lines)
    first_h2_consumed = False  # treat the first ## heading specially? not really

    while i < n:
        raw = lines[i]
        stripped = raw.strip()

        # Skip leading H1 (we already wrote our own)
        if stripped.startswith("# ") and not stripped.startswith("## "):
            i += 1
            continue

        # Blank line
        if stripped == "":
            i += 1
            continue

        # Headings
        if stripped.startswith("#### "):
            flows.append(Paragraph(inline(stripped[5:].strip()), S_H4))
            i += 1
            continue
        if stripped.startswith("### "):
            flows.append(Paragraph(inline(stripped[4:].strip()), S_H3))
            i += 1
            continue
        if stripped.startswith("## "):
            flows.append(Spacer(1, 4))
            flows.append(HRFlowable(width="22%", thickness=0.7, color=GOLD,
                                    spaceBefore=2, spaceAfter=4))
            flows.append(Paragraph(inline(stripped[3:].strip()), S_H2))
            i += 1
            continue

        # Tables (markdown pipe). Detect: line starts with | and next line is the rule.
        if stripped.startswith("|") and i + 1 < n and re.match(r"^\s*\|?\s*[-:]+", lines[i+1]):
            tbl_lines = []
            while i < n and lines[i].strip().startswith("|"):
                tbl_lines.append(lines[i].strip())
                i += 1
            flows.append(render_table(tbl_lines))
            flows.append(Spacer(1, 6))
            continue

        # Blockquotes
        if stripped.startswith("> "):
            block = []
            while i < n and lines[i].strip().startswith(">"):
                line = lines[i].strip()
                line = line[1:].strip() if line == ">" else line[2:] if line.startswith("> ") else line[1:]
                block.append(line)
                i += 1
            text = " ".join(block).strip()
            flows.append(render_callout(text))
            continue

        # Numbered list
        if re.match(r"^\d+\.\s", stripped):
            items = []
            while i < n and re.match(r"^\d+\.\s", lines[i].strip()):
                m = re.match(r"^(\d+)\.\s+(.*)", lines[i].strip())
                items.append((m.group(1), m.group(2)))
                i += 1
                # Continuation lines (indented) attach to previous item
                while i < n and lines[i].startswith("   ") and lines[i].strip() != "":
                    items[-1] = (items[-1][0], items[-1][1] + " " + lines[i].strip())
                    i += 1
            for num, text in items:
                flows.append(Paragraph(inline(text), S_NUMBER, bulletText=f"{num}."))
            flows.append(Spacer(1, 4))
            continue

        # Bullet list
        if re.match(r"^[-*]\s", stripped):
            while i < n and re.match(r"^[-*]\s", lines[i].strip()):
                txt = re.sub(r"^[-*]\s+", "", lines[i].strip())
                # Continuation lines (indented) attach
                i += 1
                while i < n and lines[i].startswith("  ") and lines[i].strip() != "" \
                        and not re.match(r"^[-*]\s", lines[i].strip()):
                    txt += " " + lines[i].strip()
                    i += 1
                flows.append(Paragraph(inline(txt), S_BULLET, bulletText="•"))
            flows.append(Spacer(1, 4))
            continue

        # Horizontal rule
        if stripped in ("---", "***", "___"):
            flows.append(HRFlowable(width="100%", thickness=0.6, color=RULE,
                                    spaceBefore=8, spaceAfter=8))
            i += 1
            continue

        # Paragraph (collect until blank line)
        para = [raw]
        i += 1
        while i < n and lines[i].strip() != "" \
                and not lines[i].strip().startswith("#") \
                and not lines[i].strip().startswith(">") \
                and not lines[i].strip().startswith("|") \
                and not re.match(r"^[-*]\s", lines[i].strip()) \
                and not re.match(r"^\d+\.\s", lines[i].strip()):
            para.append(lines[i])
            i += 1
        para_text = " ".join(p.strip() for p in para).strip()
        if para_text:
            flows.append(Paragraph(inline(para_text), S_BODY_LEFT))

    return flows


def render_table(lines):
    """Convert a list of pipe-table lines to a styled ReportLab Table."""
    rows = []
    for ln in lines:
        ln = ln.strip().strip("|")
        # Skip the alignment rule line
        if re.match(r"^\s*[-:]+\s*(\|\s*[-:]+\s*)*$", ln):
            continue
        cells = [c.strip() for c in ln.split("|")]
        rows.append(cells)

    if not rows:
        return Spacer(1, 0)

    # Wrap each cell in a Paragraph for wrapping behavior
    cell_style = style("tcell", fontName="Times-Roman", fontSize=9.5, leading=13,
                       textColor=INK, alignment=TA_LEFT)
    head_style = style("thead", fontName="Helvetica-Bold", fontSize=9.0, leading=12,
                       textColor=PAPER, alignment=TA_LEFT)
    rendered = []
    for r_idx, row in enumerate(rows):
        rendered_row = []
        for c in row:
            stl = head_style if r_idx == 0 else cell_style
            rendered_row.append(Paragraph(inline(c), stl))
        rendered.append(rendered_row)

    # Auto column widths: equal split, with first col slightly wider if 2 cols
    n_cols = max(len(r) for r in rendered)
    avail = PAGE_W - 2 * MARGIN_X
    if n_cols == 2:
        col_w = [avail * 0.46, avail * 0.54]
    elif n_cols == 3:
        col_w = [avail * 0.32, avail * 0.36, avail * 0.32]
    else:
        col_w = [avail / n_cols] * n_cols

    t = Table(rendered, colWidths=col_w, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GOLD),
        ("TEXTCOLOR", (0, 0), (-1, 0), PAPER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PAPER, CALLOUT_BG]),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, GOLD_DARK),
        ("BOX", (0, 0), (-1, -1), 0.4, RULE),
    ]))
    return t


def render_callout(text: str):
    para = Paragraph(inline(text), S_QUOTE)
    t = Table([[para]], colWidths=[PAGE_W - 2 * MARGIN_X], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CALLOUT_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return KeepTogether([t, Spacer(1, 8)])


# ─── Page templates ─────────────────────────────────────────────────────────

def cover_template(canvas, doc):
    canvas.saveState()
    # Soft paper background
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Top + bottom gold rules
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1.5)
    canvas.line(0.85 * inch, PAGE_H - 0.85 * inch, PAGE_W - 0.85 * inch, PAGE_H - 0.85 * inch)
    canvas.line(0.85 * inch, 0.85 * inch, PAGE_W - 0.85 * inch, 0.85 * inch)
    canvas.restoreState()


def main_template(canvas, doc):
    canvas.saveState()
    # Paper
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Header band
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(MARGIN_X, PAGE_H - 0.55 * inch, "BRIDGEPOINTE")
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(MARGIN_X + 1.05 * inch, PAGE_H - 0.55 * inch, "CREW PORTAL")
    canvas.setFillColor(INK_MUTE)
    canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 0.55 * inch, "Owner's Guide · 2026")
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN_X, PAGE_H - 0.7 * inch, PAGE_W - MARGIN_X, PAGE_H - 0.7 * inch)

    # Footer
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, 0.65 * inch, PAGE_W - MARGIN_X, 0.65 * inch)
    canvas.setFillColor(INK_MUTE)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(MARGIN_X, 0.45 * inch, "Bridgepointe Crew Portal · Owner's Guide")
    canvas.drawRightString(PAGE_W - MARGIN_X, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


# ─── Build ──────────────────────────────────────────────────────────────────

def build():
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=LETTER,
        leftMargin=MARGIN_X, rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
        title="Bridgepointe Crew Portal — Owner's Guide",
        author="Bridgepointe",
        subject="Owner's guide to the Bridgepointe Crew Portal",
    )

    frame_main = Frame(MARGIN_X, MARGIN_BOTTOM,
                       PAGE_W - 2 * MARGIN_X,
                       PAGE_H - MARGIN_TOP - MARGIN_BOTTOM,
                       id="main", showBoundary=0)
    frame_cover = Frame(MARGIN_X, MARGIN_BOTTOM,
                        PAGE_W - 2 * MARGIN_X,
                        PAGE_H - 2 * MARGIN_BOTTOM,
                        id="cover", showBoundary=0)

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=frame_cover, onPage=cover_template),
        PageTemplate(id="main", frames=frame_main, onPage=main_template),
    ])

    flows = []

    # ── Cover page ──
    flows.append(Spacer(1, 1.4 * inch))
    flows.append(Paragraph("BRIDGEPOINTE", S_COVER_BRAND))
    flows.append(Spacer(1, 6))
    flows.append(Paragraph("WHERE CRAFT MEETS HOME", S_COVER_EYEBROW))
    flows.append(Spacer(1, 1.0 * inch))
    flows.append(HRFlowable(width="35%", thickness=1.4, color=GOLD,
                            spaceBefore=0, spaceAfter=22, hAlign="CENTER"))
    flows.append(Paragraph("Crew Portal", S_COVER_EYEBROW))
    flows.append(Spacer(1, 4))
    flows.append(Paragraph("Owner's Guide", S_COVER_TITLE))
    flows.append(Spacer(1, 18))
    flows.append(Paragraph(
        "A field-to-office system for in-house crew and<br/>"
        "subcontractors — bilingual, mobile-first, owner-built.",
        S_COVER_SUB))
    flows.append(Spacer(1, 1.6 * inch))
    flows.append(HRFlowable(width="20%", thickness=0.8, color=GOLD,
                            spaceBefore=0, spaceAfter=14, hAlign="CENTER"))
    flows.append(Paragraph(
        f"Prepared for the owner · {datetime.now().strftime('%B %Y')}",
        S_COVER_FOOT))

    # Switch to main template after cover
    flows.append(NextPageTemplate("main"))
    flows.append(PageBreak())

    # ── Table of Contents ──
    flows.append(Paragraph("CONTENTS", S_EYEBROW))
    flows.append(HRFlowable(width="100%", thickness=1.5, color=GOLD,
                            spaceBefore=2, spaceAfter=14))
    flows.append(Paragraph("What's inside", S_H1))
    flows.append(Spacer(1, 18))

    for _, num, title, desc in SECTIONS:
        row = Table(
            [[
                Paragraph(num, S_TOC_NUM),
                Paragraph(f"<b>{title}</b><br/>"
                          f"<font name='Times-Italic' color='#7a7268' size='9.5'>{desc}</font>",
                          S_TOC_TITLE),
            ]],
            colWidths=[0.5 * inch, PAGE_W - 2 * MARGIN_X - 0.5 * inch],
        )
        row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
        ]))
        flows.append(row)
        flows.append(Spacer(1, 10))

    flows.append(Spacer(1, 30))
    flows.append(Paragraph(
        "<i>This guide pairs with the live system at <b>/admin</b> (office) "
        "and <b>/portal</b> (crew). Both share the same database, the same "
        "people, and the same source of truth.</i>",
        S_LEAD))

    # ── Sections ──
    for fname, num, title, _desc in SECTIONS:
        flows.append(PageBreak())
        md = (SECTIONS_DIR / fname).read_text(encoding="utf-8")
        flows.extend(parse_section(md, num, title))

    # ── Closing page ──
    flows.append(PageBreak())
    flows.append(Spacer(1, 2.2 * inch))
    flows.append(HRFlowable(width="22%", thickness=1.2, color=GOLD,
                            spaceBefore=0, spaceAfter=20, hAlign="CENTER"))
    flows.append(Paragraph("BRIDGEPOINTE", style("end_brand", fontName="Times-Bold",
                                                  fontSize=22, leading=26, textColor=INK,
                                                  alignment=TA_CENTER)))
    flows.append(Spacer(1, 4))
    flows.append(Paragraph("Where Craft Meets Home",
                            style("end_tag", fontName="Times-Italic", fontSize=11,
                                  leading=14, textColor=INK_SOFT, alignment=TA_CENTER)))
    flows.append(Spacer(1, 12))
    flows.append(Paragraph("Atlanta, Georgia",
                            style("end_loc", fontName="Helvetica", fontSize=9,
                                  leading=13, textColor=INK_MUTE, alignment=TA_CENTER)))
    flows.append(Spacer(1, 30))
    flows.append(HRFlowable(width="14%", thickness=0.8, color=GOLD,
                            spaceBefore=0, spaceAfter=12, hAlign="CENTER"))
    flows.append(Paragraph(
        f"Owner's Guide · {datetime.now().strftime('%B %Y')}",
        S_COVER_FOOT))

    doc.build(flows)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    build()
