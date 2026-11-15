# ORBITAL: Recent Updates and Ideas

This note summarizes the recent maintenance work and suggests practical next steps for the website.

## Recent updates

- Installed the frontend dependencies and the backend requirements in a Python 3.12 virtual environment.
- Upgraded the frontend to Next.js 16 and React 19, updated the related type packages, and added a working ESLint setup.
- Updated the dependency overrides to address the reported frontend security advisories.
- Replaced deprecated Sass imports and color helpers with current Sass syntax.
- Fixed lint and type issues in the frontend and removed unused imports in several backend modules.
- Fixed duplicate React keys in the molecular-feature list and configured the root page's smooth scrolling for Next.js.
- Fixed the blink viewer's parent-state update during a state updater and awaited Next.js 16 dynamic route parameters on observation pages.
- Added cursor-centered mouse-wheel zoom to both in-app sky image previews; scrolling over the preview zooms without scrolling the page.
- Removed the duplicate image demo from “Image Comparison: What to Look For,” improved pointer-based dragging in the Multi-Epoch Differential Analysis split view, and kept its epoch labels below the navigation bar.
- Updated the README with the frontend's current Node.js and Next.js requirements.

## Validation and setup tips

The following checks passed after the updates:

- Frontend production build
- Frontend lint (0 errors; 11 non-blocking `<img>` optimization warnings remain)
- Frontend dependency audit (0 reported vulnerabilities)
- Backend Python compilation and the FastAPI health endpoint
- Browser smoke check for the observation detail route and sky-preview mouse-wheel zoom

For local development:

- Use Node.js 20.9 or newer for the frontend.
- Use the backend virtual environment at `backend/venv` and select `backend/venv/bin/python` as the Python interpreter in VS Code. This helps Pylance find the installed backend packages.
- Install frontend dependencies from `frontend/` with `npm ci`.
- Install backend requirements into the selected Python environment with `pip install -r backend/requirements.txt`.
- Keep live archive data clearly distinguished from curated/demo data when testing or presenting results.

## Suggested website additions

### 1. Improve data provenance and status

Show whether each result is live archive data, cached data, or curated demo data. Include the archive/source, retrieval time, and any fallback or processing status. This is a useful first step because it helps users interpret scientific results correctly.

### 2. Add saved targets and observing lists

Let users bookmark targets, add notes, and group targets into named lists. A first version could store these in the browser so it works without accounts or a database.

### 3. Add candidate annotations and export

Allow users to mark a possible moving or variable object, record coordinates and observations, and export a small report as CSV or JSON. Keep annotations separate from confirmed scientific measurements.

### 4. Add time-series analysis

For targets with suitable multi-epoch measurements, provide a light curve, periodogram, and phase-folded view. Clearly show the input measurements, units, and limitations so plots are not mistaken for confirmed discoveries.

### 5. Polish image accessibility and performance

Review the remaining raw `<img>` lint warnings. Where appropriate, use Next.js image optimization; where scientific imagery needs its original pixels or dimensions, document and preserve that behavior. Add descriptive labels and keyboard support to image controls.

## Suggested order

1. Data provenance and status
2. Saved targets and notes
3. Candidate annotation and export
4. Time-series analysis
5. Image performance and accessibility review

These are suggestions for future work, not features currently implemented.
