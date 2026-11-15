"""Visitor help for understanding ORBITAL and choosing a workspace."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["guide"])


class GuideRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class GuideResponse(BaseModel):
    answer: str
    mode: str
    destination: str | None = None
    destination_label: str | None = None
    keywords: list[str] = []


def local_answer(message: str) -> GuideResponse:
    query = message.casefold()
    destination = "/explore"
    label = "Open Sky Explorer"

    # Keep the specific intents ahead of broad words like "image" and "use".
    # The guide's starter prompts should resolve to the workspace they name.
    if any(word in query for word in ("compare", "comparison", "comparator", "difference", "subtract", "epoch", "motion", "blink", "side by side", "overlay")):
        return GuideResponse(
            answer=(
                "Choose an image for A and B in Compare. The picker puts more observations of the same target first and favors a matching band; use the slider or Blink to inspect them. "
                "Displayed differences are visual aids, not calibrated detections or source-motion measurements."
            ),
            mode="local",
            destination="/compare",
            destination_label="Open Compare",
            keywords=["two epochs", "blink preview", "matching bands", "field-center offset"],
        )
    if any(word in query for word in ("source", "sources", "credit", "provenance", "archive link", "data origin")):
        return GuideResponse(
            answer=(
                "Open Sources to review the NASA/IPAC archive links, mission references, and image credits used by Orbital. "
                "Each observation identifies its source; curated DSS reference images are labeled separately from live SPHEREx records."
            ),
            mode="local",
            destination="/sources",
            destination_label="Browse image sources",
            keywords=["NASA/IPAC IRSA", "image credits", "curated references"],
        )
    if any(word in query for word in ("view the sky", "view sky", "sky viewer", "sky map", "aladin", "browse the sky")):
        return GuideResponse(
            answer=(
                "In Explore, choose the CDS Aladin Interactive Atlas view to pan and zoom around the sky. "
                "You can also select Reference Image Blinker to inspect a target's available image previews."
            ),
            mode="local",
            destination="/explore",
            destination_label="Open the sky viewer",
            keywords=["Aladin atlas", "image previews", "Explore"],
        )
    if any(word in query for word in ("upload", "my data", "own data", "file", "fits", "csv", "research study", "create a study", "my research")):
        return GuideResponse(
            answer=(
                "Open My Research from the main navigation and create a named study. Add multiple images as observation epochs, "
                "record dates, bands, field-center coordinates, and per-image notes, then compare any two epochs side by side, "
                "with an overlay, or by blinking. The workspace calculates display-level image differences and field-center offsets, "
                "and saves the images, results, and notes with the study in this browser."
            ),
            mode="local",
            destination="/research",
            destination_label="Open My Research",
            keywords=["my research", "image epochs", "compare images", "field-center offset", "study report"],
        )
    if any(word in query for word in ("note", "notes", "report", "format", "italic", "bold")):
        return GuideResponse(answer="Use Study Notes in Explore or My Research to record observations. Format them with bold, italic, lists, highlights, code, and quotations. Notes are saved on this device and included in study reports.", mode="local", destination="/research", destination_label="Open My Research", keywords=["study notes", "export report", "bold and italic", "local storage"])
    if any(word in query for word in ("spectr", "chemical", "wavelength", "102 band", "molecule")):
        return GuideResponse(
            answer=(
                "In Explore, open a target and scroll to the spectral inspector to learn how the 102-channel spectrum is read. "
                "Displayed curves and molecular markers are illustrative references, not calibrated detections."
            ),
            mode="local",
            destination="/explore",
            destination_label="Explore a target",
            keywords=["102 spectral channels", "wavelength", "molecules", "illustrative spectrum"],
        )
    if any(word in query for word in ("about", "mission", "spherex", "purpose", "what is orbital")):
        return GuideResponse(
            answer=(
                "ORBITAL is an educational exploration interface for near-infrared sky-survey data and multi-epoch observing concepts. "
                "Explore lets you search a target and inspect available previews; Compare shows two epochs; Mission explains SPHEREx and the project. "
                "Curated examples are demonstrations, not verified SPHEREx source measurements."
            ),
            mode="local",
            destination="/about",
            destination_label="Read the Mission Briefing",
            keywords=["SPHEREx", "mission", "Discover", "Explore", "Studio"],
        )
    if any(word in query for word in ("explore", "imagery", "image", "nasa", "target", "search")):
        return GuideResponse(
            answer=(
                "Open Explore, search for a target by name or coordinates, then choose an observation to inspect its preview and metadata. "
                "Live NASA/IPAC SPHEREx results and curated reference images are clearly identified as different data types."
            ),
            mode="local",
            destination="/explore",
            destination_label="Explore NASA imagery",
            keywords=["search a target", "live archive", "curated references", "view the sky"],
        )
    if any(word in query for word in ("start", "begin", "use", "navigate", "help", "target", "search")):
        return GuideResponse(
            answer=(
                "A simple first visit: open Explore, choose one of the curated targets, and inspect its observation timeline and image preview. "
                "Use Compare to review two epochs, or Mission for background. Start with curated mode so the demo examples are clearly identified."
            ),
            mode="local",
            destination=destination,
            destination_label=label,
            keywords=["object gallery", "search target", "view the sky", "curated examples"],
        )
    return GuideResponse(
        answer=(
            "I can help you find a workspace or explain the site. Explore is for targets, images, timelines, and spectra; "
            "Compare is for two-epoch previews; Mission explains SPHEREx and ORBITAL. What would you like to look at?"
        ),
        mode="local",
        destination=destination,
        destination_label=label,
        keywords=["Explore", "Studio", "mission", "study notes"],
    )


@router.post("/guide", response_model=GuideResponse)
async def ask_guide(request: GuideRequest):
    """Return keyword-guided navigation help using only local rules."""
    return local_answer(request.message)
