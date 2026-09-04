Kirkiversary mini-site

Deploy to Vercel as a flat/static site.
Keep these files/folders together:
- index.html
- styles.css
- script.js
- vercel.json
- assets/

Behavior:
- YES looks active but is locked until NO is clicked at least once.
- Every NO click simultaneously: plays Vine Boom, flashes reaction photo, morphs + dodges NO.
- NO stays inside the viewport and attempts to avoid YES.
- At 10 NO clicks, YES grows by 20%.
- Clicking unlocked YES shows the final image full-screen and loops noname.mp3.
- Reload resets all state.
- Vercel headers disable caching for this build.
