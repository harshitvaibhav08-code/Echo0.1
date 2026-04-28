I'll close the loop on this with three things in parallel: (1) overwrite `script.js` to add the `BusinessFinder` module, a tiny `Profile` store, a `FinalSummary` overlay, plus minimal hooks in CineProfile/VacationFinder so they publish to the store; (2) extend `style.css` with gold-accented Business styles + the floating CTA + modal; (3) lint to verify.
Action: file_editor create /app/script.js --file-text "/* ============================================================
   Modular Web App — Navigation, Profile store, CineProfile,
   VacationFinder, BusinessFinder, FinalSummary
   ------------------------------------------------------------
     1. Navigation         — page 1 -> page 2 transition
     2. Profile store      — single source of truth for results
     3. CineProfile        — 15-question genre profiler
     4. VacationFinder     — 15-question trip profiler
                             (burnout override + seasonal + duration
                              + weighted final formula)
     5. BusinessFinder     — 12-question business-type profiler
                             (hard filters + multipliers + bonuses)
     6. FinalSummary       — floating CTA + overlay showing all
                             three results once they are complete
     7. Bootstrap          — mount modules into the dashboard
   ============================================================ */


/* ============================================================
   1. NAVIGATION
   ============================================================ */
(function navigation() {
    \"use strict\";

    const page1    = document.getElementById(\"page-1\");
    const page2    = document.getElementById(\"page-2\");
    const startBtn = document.getElementById(\"start-btn\");

    function goToDashboard() {
        if (!page1 || !page2) return;
        page1.classList.add(\"hidden\");
        page2.classList.remove(\"hidden\");
        page2.setAttribute(\"tabindex\", \"-1\");
        page2.focus({ preventScroll: true });
    }

    if (startBtn) {
        startBtn.addEventListener(\"click\", goToDashboard);
    }
})();


/* ============================================================
   2. PROFILE STORE
   ------------------------------------------------------------
   Lightweight pub/sub. Each quiz publishes its result here,
   and FinalSummary subscribes so the floating CTA can appear
   only once all three are present.
   ============================================================ */
const Profile = (function () {
    \"use strict\";

    const data      = { cineprofile: null, vacation: null, business: null };
    const listeners = [];

    function setResult(key, payload) {
        data[key] = payload;
        listeners.forEach((fn) => fn(getAll()));
    }
    function getAll() {
        return { ...data };
    }
    function isComplete() {
        return !!data.cineprofile && !!data.vacation && !!data.business;
    }
    function subscribe(fn) {
        listeners.push(fn);
    }

    return { setResult, getAll, isComplete, subscribe };
})();


/* ============================================================
   3. CINEPROFILE MODULE
   ============================================================ */
const CineProfile = (function () {
    \"use strict\";

    const GENRES = [
        \"Comedy\", \"Drama\", \"Action\", \"Thriller\", \"Mystery\", \"Crime\",
        \"Romance\", \"Horror\", \"Sci-Fi\", \"Fantasy\", \"Adventure\", \"Historical\",
    ];

    const QUESTIONS = [
        { question: \"Friday night — what's your perfect movie vibe?\", options: [
            { label: \"Belly laughs and silly hijinks\",   primary: 0, secondary: [6] },
            { label: \"Edge-of-seat thrills\",             primary: 3, secondary: [2] },
            { label: \"A puzzle to solve\",                primary: 4, secondary: [5] },
            { label: \"An emotional journey\",             primary: 1, secondary: [6] },
        ]},
        { question: \"Which setting pulls you in most?\", options: [
            { label: \"Distant galaxies and alien worlds\", primary: 8,  secondary: [10] },
            { label: \"Enchanted kingdoms with magic\",     primary: 9,  secondary: [10] },
            { label: \"A gritty city at night\",            primary: 5,  secondary: [3] },
            { label: \"Sweeping period palaces\",           primary: 11, secondary: [1] },
        ]},
        { question: \"Pick a protagonist you'd follow:\", options: [
            { label: \"A wisecracking outlaw\",          primary: 0, secondary: [5] },
            { label: \"A haunted detective\",            primary: 4, secondary: [5, 1] },
            { label: \"A reluctant hero with a sword\",  primary: 9, secondary: [10] },
            { label: \"A scientist with a wild theory\", primary: 8, secondary: [1] },
        ]},
        { question: \"Sound design that hooks you:\", options: [
            { label: \"Tense strings & low rumbles\",     primary: 3,  secondary: [7] },
            { label: \"Sweeping orchestral score\",       primary: 10, secondary: [9, 11] },
            { label: \"Pop hits and witty banter\",       primary: 0,  secondary: [6] },
            { label: \"Synthwave / electronic textures\", primary: 8,  secondary: [2] },
        ]},
        { question: \"A plot device you can't resist:\", options: [
            { label: \"An impossible heist\", primary: 5, secondary: [3] },
            { label: \"A forbidden romance\", primary: 6, secondary: [1] },
            { label: \"A haunted house\",     primary: 7, secondary: [4] },
            { label: \"A time loop\",         primary: 8, secondary: [4] },
        ]},
        { question: \"Your preferred pace:\", options: [
            { label: \"Slow burn, character driven\", primary: 1, secondary: [4] },
            { label: \"Non-stop adrenaline\",         primary: 2, secondary: [10] },
            { label: \"Twists every ten minutes\",    primary: 3, secondary: [4] },
            { label: \"Cosy, warm, low stakes\",      primary: 0, secondary: [6] },
        ]},
        { question: \"Which line would make you press play?\", options: [
            { label: \"\\"They'll never see this coming.\\"\", primary: 5, secondary: [3] },
            { label: \"\\"I love you. Always have.\\"\",       primary: 6, secondary: [1] },
            { label: \"\\"What was that noise?\\"\",           primary: 7, secondary: [4] },
            { label: \"\\"Set course for the unknown.\\"\",    primary: 8, secondary: [10] },
        ]},
        { question: \"Which era of film feels like home?\", options: [
            { label: \"Classic Hollywood epics\",        primary: 11, secondary: [1] },
            { label: \"'80s blockbusters\",              primary: 2,  secondary: [10] },
            { label: \"'90s rom-coms\",                  primary: 6,  secondary: [0] },
            { label: \"Modern psychological thrillers\", primary: 3,  secondary: [4] },
        ]},
        { question: \"Most compelling antagonist:\", options: [
            { label: \"A masked serial killer\",     primary: 7, secondary: [3] },
            { label: \"A charming con artist\",      primary: 5, secondary: [0] },
            { label: \"A ruthless empire\",          primary: 8, secondary: [2, 10] },
            { label: \"A dragon or dark sorcerer\",  primary: 9, secondary: [10] },
        ]},
        { question: \"Pick the location for the climax:\", options: [
            { label: \"A rooftop chase\",       primary: 2, secondary: [3] },
            { label: \"A candle-lit ballroom\", primary: 6, secondary: [11] },
            { label: \"A foggy moor\",          primary: 4, secondary: [7] },
            { label: \"A starship bridge\",     primary: 8, secondary: [10] },
        ]},
        { question: \"Best ending for you:\", options: [
            { label: \"Bittersweet, you cried\",  primary: 1, secondary: [6] },
            { label: \"Triumphant, fist in air\", primary: 2, secondary: [10] },
            { label: \"The big twist reveal\",    primary: 3, secondary: [4] },
            { label: \"Hilarious final gag\",     primary: 0, secondary: [6] },
        ]},
        { question: \"Which world would you most want to visit?\", options: [
            { label: \"A magical academy\",     primary: 9,  secondary: [4] },
            { label: \"A war-torn nation\",     primary: 11, secondary: [1] },
            { label: \"A future Mars colony\",  primary: 8,  secondary: [10] },
            { label: \"A neon-lit underworld\", primary: 5,  secondary: [3] },
        ]},
        { question: \"Your co-watcher's mood tonight:\", options: [
            { label: \"Wants to laugh\",    primary: 0, secondary: [6] },
            { label: \"Loves to scream\",   primary: 7, secondary: [3] },
            { label: \"Prefers tears\",     primary: 1, secondary: [6] },
            { label: \"Craves explosions\", primary: 2, secondary: [10] },
        ]},
        { question: \"The theme that resonates most:\", options: [
            { label: \"Survival against the odds\", primary: 10, secondary: [2, 1] },
            { label: \"Justice and consequence\",   primary: 5,  secondary: [1] },
            { label: \"Love conquers all\",         primary: 6,  secondary: [1] },
            { label: \"Truth behind the illusion\", primary: 4,  secondary: [3, 8] },
        ]},
        { question: \"Pick the credit-roll feeling:\", options: [
            { label: \"\\"What just happened?!\\"\",  primary: 4, secondary: [3] },
            { label: \"\\"I want to live there.\\"\", primary: 9, secondary: [10] },
            { label: \"\\"That was beautiful.\\"\",   primary: 1, secondary: [6] },
            { label: \"\\"Let's watch it again.\\"\", primary: 2, secondary: [0] },
        ]},
    ];

    let root           = null;
    let scores         = new Array(12).fill(0);
    let primaryCounts  = new Array(12).fill(0);
    let currentIndex   = 0;
    let selectedOption = null;

    function mount(rootEl) {
        if (!rootEl) return;
        root = rootEl;
        reset();
    }

    function reset() {
        scores         = new Array(12).fill(0);
        primaryCounts  = new Array(12).fill(0);
        currentIndex   = 0;
        selectedOption = null;
        Profile.setResult(\"cineprofile\", null);
        renderQuestion();
    }

    function renderQuestion() {
        const q       = QUESTIONS[currentIndex];
        const total   = QUESTIONS.length;
        const stepNum = currentIndex + 1;
        const percent = (stepNum / total) * 100;
        const isLast  = currentIndex === total - 1;

        root.innerHTML = `
            <div class=\"quiz-card\" data-testid=\"cineprofile-quiz-card\">
                <div class=\"quiz-progress\">
                    <div class=\"quiz-progress__meta\">
                        <span class=\"quiz-progress__label\">Question ${stepNum} of ${total}</span>
                        <span class=\"quiz-progress__pct\">${Math.round(percent)}%</span>
                    </div>
                    <div class=\"quiz-progress__track\">
                        <div class=\"quiz-progress__fill\" style=\"width:${percent}%\"></div>
                    </div>
                </div>

                <h3 class=\"quiz-question\" data-testid=\"cineprofile-question\">${q.question}</h3>

                <div class=\"quiz-options\" role=\"radiogroup\" aria-label=\"answer options\">
                    ${q.options.map((opt, i) => `
                        <button class=\"quiz-option\" type=\"button\" role=\"radio\"
                            aria-checked=\"false\" data-index=\"${i}\"
                            data-testid=\"cineprofile-option-${i}\">
                            <span class=\"quiz-option__letter\">${\"ABCD\"[i]}</span>
                            <span class=\"quiz-option__label\">${opt.label}</span>
                        </button>
                    `).join(\"\")}
                </div>

                <div class=\"quiz-actions\">
                    <button class=\"primary-button quiz-next\" type=\"button\"
                        disabled data-testid=\"cineprofile-next-btn\">
                        ${isLast ? \"See Results\" : \"Next\"}
                    </button>
                </div>
            </div>
        `;

        bindQuestionEvents();
    }

    function bindQuestionEvents() {
        const optionButtons = root.querySelectorAll(\".quiz-option\");
        const nextButton    = root.querySelector(\".quiz-next\");

        optionButtons.forEach((btn) => {
            btn.addEventListener(\"click\", () => {
                optionButtons.forEach((b) => {
                    b.classList.remove(\"is-selected\");
                    b.setAttribute(\"aria-checked\", \"false\");
                });
                btn.classList.add(\"is-selected\");
                btn.setAttribute(\"aria-checked\", \"true\");
                selectedOption = parseInt(btn.dataset.index, 10);
                nextButton.disabled = false;
            });
        });

        nextButton.addEventListener(\"click\", handleNext);
    }

    function handleNext() {
        if (selectedOption === null) return;
        const q   = QUESTIONS[currentIndex];
        const opt = q.options[selectedOption];

        scores[opt.primary]        += 3;
        primaryCounts[opt.primary] += 1;
        opt.secondary.forEach((g) => { scores[g] += 1; });

        selectedOption = null;
        currentIndex  += 1;

        if (currentIndex >= QUESTIONS.length) {
            renderResults();
        } else {
            renderQuestion();
        }
    }

    function buildRanking() {
        const totalPoints = scores.reduce((sum, s) => sum + s, 0) || 1;
        const ranked = GENRES.map((name, id) => ({
            id, name,
            score:        scores[id],
            primaryCount: primaryCounts[id],
            percent:      (scores[id] / totalPoints) * 100,
        }));

        ranked.sort((a, b) => {
            if (Math.abs(a.score - b.score) <= 2) {
                if (b.primaryCount !== a.primaryCount) {
                    return b.primaryCount - a.primaryCount;
                }
            }
            return b.score - a.score;
        });

        return ranked;
    }

    function renderResults() {
        const ranked = buildRanking();
        const top    = ranked[0];
        const second = ranked[1];
        const also   = ranked.slice(2, 4);

        // Publish to shared store
        Profile.setResult(\"cineprofile\", { top, second, also });

        root.innerHTML = `
            <div class=\"quiz-card quiz-card--results\" data-testid=\"cineprofile-results\">
                <p class=\"results-eyebrow\">Your CineProfile</p>

                <div class=\"result-block result-block--primary\" data-testid=\"cineprofile-top-match\">
                    <span class=\"result-block__rank\">Top match</span>
                    <h3 class=\"result-block__name\">${top.name}</h3>
                    <span class=\"result-block__pct\">${top.percent.toFixed(1)}%</span>
                </div>

                <div class=\"result-block\" data-testid=\"cineprofile-secondary-match\">
                    <span class=\"result-block__rank\">Secondary match</span>
                    <h4 class=\"result-block__name\">${second.name}</h4>
                    <span class=\"result-block__pct\">${second.percent.toFixed(1)}%</span>
                </div>

                <div class=\"result-also\" data-testid=\"cineprofile-also-likely\">
                    <span class=\"result-also__title\">Also likely</span>
                    <ul class=\"result-also__list\">
                        ${also.map((g) => `
                            <li class=\"result-also__item\">
                                <span>${g.name}</span>
                                <span class=\"result-also__pct\">${g.percent.toFixed(1)}%</span>
                            </li>
                        `).join(\"\")}
                    </ul>
                </div>

                <div class=\"quiz-actions\">
                    <button class=\"primary-button quiz-reset\" type=\"button\"
                        data-testid=\"cineprofile-reset-btn\">
                        Restart CineProfile
                    </button>
                </div>
            </div>
        `;

        root.querySelector(\".quiz-reset\").addEventListener(\"click\", reset);
    }

    return { mount };
})();


/* ============================================================
   4. VACATIONFINDER MODULE
   ============================================================ */
const VacationFinder = (function () {
    \"use strict\";

    const CATEGORIES = {
        R: \"Relaxation\", A: \"Adventure\", C: \"Culture\", S: \"Social\",
        W: \"Wellness\",   L: \"Luxury\",    B: \"Budget\",  N: \"Nature\",
    };
    const CAT_KEYS = Object.keys(CATEGORIES);

    const TRIP_TYPES = {
        AB: \"Budget Adventure\", AC: \"Active Cultural Tour\", AL: \"Premium Adventure\",
        AN: \"Adventure Safari\", AR: \"Restorative Adventure\", AS: \"Active Group Getaway\",
        AW: \"Active Wellness Escape\", BC: \"Cultural Backpacking\", BL: \"Smart-Spend Trip\",
        BN: \"Nature Camping Trip\", BR: \"Affordable Reset\", BS: \"Backpacker Social Trip\",
        BW: \"Mindful Budget Retreat\", CL: \"Luxury Heritage Tour\", CN: \"Eco-Cultural Journey\",
        CR: \"Cultural Recharge\", CS: \"Cultural City Break\", CW: \"Mindful Culture Trip\",
        LN: \"Luxury Eco-Lodge\", LR: \"Luxury Recharge\", LS: \"Glamour City Break\",
        LW: \"Premium Wellness Escape\", NR: \"Quiet Nature Retreat\", NS: \"Outdoor Social Trip\",
        NW: \"Forest Wellness\", RS: \"Sociable Slow Trip\", RW: \"Wellness Retreat\",
        SW: \"Social Wellness Trip\",
    };

    function tripTypeFor(a, b) {
        const key = [a, b].sort().join(\"\");
        return TRIP_TYPES[key] || `${CATEGORIES[a]} & ${CATEGORIES[b]} Mix`;
    }

    const QUESTIONS = [
        { phase: \"Intent\", question: \"Why are you traveling?\", options: [
            { label: \"To recharge & disconnect\",         primary: \"R\", secondary: [\"W\"] },
            { label: \"To feel alive & seek thrill\",      primary: \"A\", secondary: [\"N\"] },
            { label: \"To explore new cultures\",          primary: \"C\", secondary: [] },
            { label: \"To celebrate or be social\",        primary: \"S\", secondary: [\"L\"] },
        ]},
        { phase: \"Intent\", question: \"Which best describes your current state?\", options: [
            { label: \"Burned out\",                       primary: \"R\", secondary: [\"W\"], tags: [\"burnout\"] },
            { label: \"Restless or understimulated\",      primary: \"A\", secondary: [\"S\"] },
            { label: \"Curious and inspired\",             primary: \"C\", secondary: [\"N\"] },
            { label: \"Energised and excited\",            primary: \"S\", secondary: [\"A\"] },
        ]},
        { phase: \"Intent\", question: \"What's the must-have on your trip?\", options: [
            { label: \"A spa or quiet retreat\",           primary: \"W\", secondary: [\"R\"] },
            { label: \"A new physical challenge\",         primary: \"A\", secondary: [\"N\"] },
            { label: \"Iconic landmarks and museums\",     primary: \"C\", secondary: [] },
            { label: \"Five-star service\",                primary: \"L\", secondary: [] },
        ]},
        { phase: \"Personality\", question: \"Your ideal Saturday morning:\", options: [
            { label: \"Sleep in, slow coffee\",            primary: \"R\", secondary: [\"W\"] },
            { label: \"Trail run or gym\",                 primary: \"A\", secondary: [] },
            { label: \"Farmers market wandering\",         primary: \"C\", secondary: [\"N\"] },
            { label: \"Brunch with friends\",              primary: \"S\", secondary: [\"L\"] },
        ]},
        { phase: \"Personality\", question: \"Pick your travel-companion vibe:\", options: [
            { label: \"Just me, my book, and silence\",    primary: \"R\", secondary: [\"W\"] },
            { label: \"An adrenaline buddy\",              primary: \"A\", secondary: [] },
            { label: \"A cultured, curious friend\",       primary: \"C\", secondary: [] },
            { label: \"The whole crew\",                   primary: \"S\", secondary: [] },
        ]},
        { phase: \"Personality\", question: \"On a five-day trip you'd prefer:\", options: [
            { label: \"Fewer activities, deeper rest\",    primary: \"R\", secondary: [\"W\"] },
            { label: \"Pack every hour\",                  primary: \"A\", secondary: [\"S\"] },
            { label: \"A balanced mix\",                   primary: \"C\", secondary: [\"N\"] },
            { label: \"White-glove curation\",             primary: \"L\", secondary: [] },
        ]},
        { phase: \"Life\", question: \"Right now, life feels:\", options: [
            { label: \"Heavy — I need a break\",           primary: \"R\", secondary: [\"W\"] },
            { label: \"Stable — ready for novelty\",       primary: \"C\", secondary: [\"A\"] },
            { label: \"Exciting — momentum\",              primary: \"S\", secondary: [\"L\"] },
            { label: \"Quiet — open to anything\",         primary: \"N\", secondary: [\"C\"] },
        ]},
        { phase: \"Life\", question: \"Stress level over the past month (1 = calm, 5 = overwhelmed):\",
          type: \"scale\",
          options: [
              { label: \"1\", value: 1 }, { label: \"2\", value: 2 }, { label: \"3\", value: 3 },
              { label: \"4\", value: 4 }, { label: \"5\", value: 5 },
          ]},
        { phase: \"Life\", question: \"How often do you travel?\", options: [
            { label: \"First trip in a while\",            primary: \"R\", secondary: [\"L\"] },
            { label: \"One of many planned\",              primary: \"C\", secondary: [\"A\"] },
            { label: \"I travel often\",                   primary: \"A\", secondary: [\"N\"] },
            { label: \"Rarely travel\",                    primary: \"C\", secondary: [\"S\"] },
        ]},
        { phase: \"Timing\", question: \"How long is the trip?\", options: [
            { label: \"Long weekend (2–3 days)\",          primary: \"R\", secondary: [\"W\"], duration: \"weekend\" },
            { label: \"About a week\",                     primary: \"C\", secondary: [\"S\"], duration: \"week\" },
            { label: \"10 to 14 days\",                    primary: \"A\", secondary: [\"N\", \"C\"], duration: \"ten\" },
            { label: \"Two weeks or more\",                primary: \"A\", secondary: [\"N\"], duration: \"long\" },
        ]},
        { phase: \"Timing\", question: \"Which month are you traveling?\", type: \"month\" },
        { phase: \"Timing\", question: \"Departure flexibility:\", options: [
            { label: \"Fixed dates only\",                 primary: \"L\", secondary: [] },
            { label: \"Flexible by week\",                 primary: \"C\", secondary: [\"A\"] },
            { label: \"Wide open\",                        primary: \"A\", secondary: [\"N\"] },
            { label: \"Last-minute spontaneity\",          primary: \"S\", secondary: [\"R\"] },
        ]},
        { phase: \"Money\", question: \"Your budget approach:\", options: [
            { label: \"Splurge — best of the best\",       primary: \"L\", secondary: [\"L\"] },
            { label: \"Mid-range comfort\",                primary: \"C\", secondary: [\"S\"] },
            { label: \"Stretch every dollar\",             primary: \"B\", secondary: [\"B\"] },
            { label: \"Backpacker frugal\",                primary: \"B\", secondary: [\"A\", \"N\"] },
        ]},
        { phase: \"Money\", question: \"Where would you sleep?\", options: [
            { label: \"Five-star resort\",                 primary: \"L\", secondary: [\"L\"] },
            { label: \"Boutique hotel\",                   primary: \"C\", secondary: [\"L\"] },
            { label: \"Mid-tier hotel or Airbnb\",         primary: \"C\", secondary: [\"S\"] },
            { label: \"Hostel or camping\",                primary: \"B\", secondary: [\"A\", \"N\"] },
        ]},
        { phase: \"Money\", question: \"When you splurge, it's on:\", options: [
            { label: \"Spa and wellness\",                 primary: \"W\", secondary: [\"L\"] },
            { label: \"Fine dining\",                      primary: \"C\", secondary: [\"L\"] },
            { label: \"Excursions and adventures\",        primary: \"A\", secondary: [\"N\"] },
            { label: \"Nothing — I stay within budget\",   primary: \"B\", secondary: [\"B\"] },
        ]},
    ];

    const MONTHS = [
        \"January\", \"February\", \"March\", \"April\", \"May\", \"June\",
        \"July\", \"August\", \"September\", \"October\", \"November\", \"December\",
    ];

    let root          = null;
    let base, mental, seasonal, durationMod;
    let burnoutFlag   = false;
    let stressLevel   = null;
    let monthValue    = null;
    let durationKey   = null;
    let currentIndex  = 0;
    let pendingAnswer = null;

    function freshScores() {
        return CAT_KEYS.reduce((o, k) => ((o[k] = 0), o), {});
    }

    function mount(rootEl) {
        if (!rootEl) return;
        root = rootEl;
        reset();
    }

    function reset() {
        base          = freshScores();
        mental        = freshScores();
        seasonal      = freshScores();
        durationMod   = freshScores();
        burnoutFlag   = false;
        stressLevel   = null;
        monthValue    = null;
        durationKey   = null;
        currentIndex  = 0;
        pendingAnswer = null;
        Profile.setResult(\"vacation\", null);
        renderQuestion();
    }

    function renderQuestion() {
        const q       = QUESTIONS[currentIndex];
        const stepNum = currentIndex + 1;
        const total   = QUESTIONS.length;
        const percent = (stepNum / total) * 100;
        const isLast  = currentIndex === total - 1;

        let body;
        if (q.type === \"scale\")      body = renderScale(q);
        else if (q.type === \"month\") body = renderMonth();
        else                         body = renderOptions(q);

        root.innerHTML = `
            <div class=\"quiz-card vacation-card\" data-testid=\"vacation-quiz-card\">
                <div class=\"quiz-progress\">
                    <div class=\"quiz-progress__meta\">
                        <span class=\"quiz-progress__label\">${q.phase} · Question ${stepNum} of ${total}</span>
                        <span class=\"quiz-progress__pct\">${Math.round(percent)}%</span>
                    </div>
                    <div class=\"quiz-progress__track\">
                        <div class=\"quiz-progress__fill\" style=\"width:${percent}%\"></div>
                    </div>
                </div>

                <h3 class=\"quiz-question\" data-testid=\"vacation-question\">${q.question}</h3>

                ${body}

                <div class=\"quiz-actions\">
                    <button class=\"primary-button quiz-next vacation-next\" type=\"button\"
                        disabled data-testid=\"vacation-next-btn\">
                        ${isLast ? \"See Recommendation\" : \"Next\"}
                    </button>
                </div>
            </div>
        `;

        bindEvents(q);
    }

    function renderOptions(q) {
        return `
            <div class=\"quiz-options\" role=\"radiogroup\" aria-label=\"answer options\">
                ${q.options.map((opt, i) => `
                    <button class=\"quiz-option vacation-option\" type=\"button\" role=\"radio\"
                        aria-checked=\"false\" data-index=\"${i}\"
                        data-testid=\"vacation-option-${i}\">
                        <span class=\"quiz-option__letter\">${\"ABCD\"[i]}</span>
                        <span class=\"quiz-option__label\">${opt.label}</span>
                    </button>
                `).join(\"\")}
            </div>
        `;
    }

    function renderScale(q) {
        return `
            <div class=\"quiz-scale\" role=\"radiogroup\" aria-label=\"stress level\">
                ${q.options.map((opt) => `
                    <button class=\"quiz-scale__btn\" type=\"button\" role=\"radio\"
                        aria-checked=\"false\" data-value=\"${opt.value}\"
                        data-testid=\"vacation-scale-${opt.value}\">
                        ${opt.label}
                    </button>
                `).join(\"\")}
            </div>
            <div class=\"quiz-scale__legend\">
                <span>calm</span><span>overwhelmed</span>
            </div>
        `;
    }

    function renderMonth() {
        return `
            <select class=\"quiz-month-select\" data-testid=\"vacation-month-select\">
                <option value=\"\" disabled selected>Choose a month…</option>
                ${MONTHS.map((m, i) => `
                    <option value=\"${i + 1}\">${m}</option>
                `).join(\"\")}
            </select>
        `;
    }

    function bindEvents(q) {
        const nextBtn = root.querySelector(\".vacation-next\");

        if (q.type === \"scale\") {
            const buttons = root.querySelectorAll(\".quiz-scale__btn\");
            buttons.forEach((btn) => {
                btn.addEventListener(\"click\", () => {
                    buttons.forEach((b) => {
                        b.classList.remove(\"is-selected\");
                        b.setAttribute(\"aria-checked\", \"false\");
                    });
                    btn.classList.add(\"is-selected\");
                    btn.setAttribute(\"aria-checked\", \"true\");
                    pendingAnswer = { type: \"scale\", value: parseInt(btn.dataset.value, 10) };
                    nextBtn.disabled = false;
                });
            });
        } else if (q.type === \"month\") {
            const select = root.querySelector(\".quiz-month-select\");
            select.addEventListener(\"change\", () => {
                const v = parseInt(select.value, 10);
                if (Number.isFinite(v)) {
                    pendingAnswer = { type: \"month\", value: v };
                    nextBtn.disabled = false;
                }
            });
        } else {
            const optionButtons = root.querySelectorAll(\".vacation-option\");
            optionButtons.forEach((btn) => {
                btn.addEventListener(\"click\", () => {
                    optionButtons.forEach((b) => {
                        b.classList.remove(\"is-selected\");
                        b.setAttribute(\"aria-checked\", \"false\");
                    });
                    btn.classList.add(\"is-selected\");
                    btn.setAttribute(\"aria-checked\", \"true\");
                    pendingAnswer = { type: \"options\", index: parseInt(btn.dataset.index, 10) };
                    nextBtn.disabled = false;
                });
            });
        }

        nextBtn.addEventListener(\"click\", () => handleNext(q));
    }

    function handleNext(q) {
        if (!pendingAnswer) return;

        if (pendingAnswer.type === \"options\") {
            const opt = q.options[pendingAnswer.index];
            base[opt.primary] += 3;
            opt.secondary.forEach((k) => { base[k] += 1; });
            if (opt.tags && opt.tags.includes(\"burnout\")) burnoutFlag = true;
            if (opt.duration) durationKey = opt.duration;
        } else if (pendingAnswer.type === \"scale\") {
            stressLevel = pendingAnswer.value;
            if (stressLevel >= 4) { mental.R += 3; mental.W += 3; }
            else if (stressLevel <= 2) { mental.A += 2; mental.S += 1; }
        } else if (pendingAnswer.type === \"month\") {
            monthValue = pendingAnswer.value;
        }

        pendingAnswer = null;
        currentIndex += 1;

        if (currentIndex >= QUESTIONS.length) {
            applyOverridesAndRender();
        } else {
            renderQuestion();
        }
    }

    function applyOverridesAndRender() {
        const burnoutTriggered = burnoutFlag && stressLevel !== null && stressLevel >= 4;
        if (burnoutTriggered) {
            mental.R += 5;
            mental.W += 5;
        }

        if (monthValue !== null) {
            if (monthValue >= 4 && monthValue <= 6)             seasonal.N += 2;
            else if ([12, 1, 2].includes(monthValue))            seasonal.A += 2;
            else if (monthValue >= 7 && monthValue <= 9)        { seasonal.S += 1; seasonal.L += 1; }
            else if (monthValue === 10 || monthValue === 11)     seasonal.C += 1;
            else if (monthValue === 3)                           seasonal.N += 1;
        }

        if      (durationKey === \"weekend\") { durationMod.R += 3; durationMod.W += 2; }
        else if (durationKey === \"week\")    { durationMod.C += 2; durationMod.S += 1; }
        else if (durationKey === \"ten\")     { durationMod.A += 2; durationMod.N += 2; durationMod.C += 1; }
        else if (durationKey === \"long\")    { durationMod.A += 3; durationMod.N += 3; }

        const finals = {};
        CAT_KEYS.forEach((k) => {
            finals[k] =
                base[k]        * 0.6 +
                mental[k]      * 0.2 +
                seasonal[k]    * 0.1 +
                durationMod[k] * 0.1;
        });

        if (burnoutTriggered) {
            const totalAll = CAT_KEYS.reduce((s, k) => s + finals[k], 0);
            const cap = totalAll * 0.2;
            if (finals.A > cap) finals.A = cap;
        }

        const totalAll = CAT_KEYS.reduce((s, k) => s + finals[k], 0) || 1;
        const ranked = CAT_KEYS.map((k) => ({
            key:     k,
            name:    CATEGORIES[k],
            score:   finals[k],
            percent: (finals[k] / totalAll) * 100,
        })).sort((a, b) => b.score - a.score);

        renderResults(ranked, finals);
    }

    function renderResults(ranked, finals) {
        const top      = ranked[0];
        const second   = ranked[1];
        const tripType = tripTypeFor(top.key, second.key);

        let style = \"Mid-range\";
        if (finals.L - finals.B >= 2)      style = \"Luxury\";
        else if (finals.B - finals.L >= 2) style = \"Budget\";

        let vibe = \"Balanced\";
        if (finals.A > finals.R * 1.3)      vibe = \"High-energy\";
        else if (finals.R > finals.A * 1.3) vibe = \"Slow-paced\";

        // Publish to shared store
        Profile.setResult(\"vacation\", { tripType, style, vibe, top, second, ranked });

        root.innerHTML = `
            <div class=\"quiz-card quiz-card--results vacation-card\" data-testid=\"vacation-results\">
                <p class=\"results-eyebrow\">Your Vacation Match</p>

                <div class=\"result-block result-block--primary\"
                    data-testid=\"vacation-trip-type\">
                    <span class=\"result-block__rank\">Primary recommendation</span>
                    <h3 class=\"result-block__name\">${tripType}</h3>
                    <span class=\"result-block__pct\">${Math.round(top.percent)}%</span>
                </div>

                <div class=\"vacation-tags\">
                    <span class=\"vacation-tag\" data-testid=\"vacation-style-tag\">
                        <span class=\"vacation-tag__label\">Style</span>
                        <span class=\"vacation-tag__value\">${style}</span>
                    </span>
                    <span class=\"vacation-tag\" data-testid=\"vacation-vibe-tag\">
                        <span class=\"vacation-tag__label\">Vibe</span>
                        <span class=\"vacation-tag__value\">${vibe}</span>
                    </span>
                </div>

                <div class=\"result-also\" data-testid=\"vacation-breakdown\">
                    <span class=\"result-also__title\">Top buckets</span>
                    <ul class=\"result-also__list\">
                        ${ranked.slice(0, 4).map((g) => `
                            <li class=\"result-also__item\">
                                <span>${g.name}</span>
                                <span class=\"result-also__pct\">${g.percent.toFixed(1)}%</span>
                            </li>
                        `).join(\"\")}
                    </ul>
                </div>

                <div class=\"quiz-actions\">
                    <button class=\"primary-button quiz-reset vacation-reset\" type=\"button\"
                        data-testid=\"vacation-reset-btn\">
                        Restart Vacation Finder
                    </button>
                </div>
            </div>
        `;

        root.querySelector(\".vacation-reset\").addEventListener(\"click\", reset);
    }

    return { mount };
})();


/* ============================================================
   5. BUSINESSFINDER MODULE
   ------------------------------------------------------------
   10 categories (B1–B10), 12 questions across Budget / Risk /
   Skills / Time / Growth.

   Hard filters & multipliers (applied AFTER all answers, BEFORE
   normalisation):
     - Q1 = A (Under ₹50,000)  -> Zero out B5 and B6
     - Q2 = A (Low Risk)       -> Multiply B5 by 0.5
     - Q8 = A (2–4 hours/week) -> +5 flat to B10 and B7
   ============================================================ */
const BusinessFinder = (function () {
    \"use strict\";

    /* ---------- 10 categories ---------- */
    const CATEGORIES = {
        B1:  { name: \"Service Business\",
               why:  \"You shine in client-facing expertise — lean overhead, deep relationships, and direct value.\" },
        B2:  { name: \"Creative Brand\",
               why:  \"You're best suited for craft-driven ventures where taste and originality are the moat.\" },
        B3:  { name: \"E-commerce\",
               why:  \"You're built for product-market loops — listing, testing, and scaling fast online.\" },
        B4:  { name: \"Coaching & Education\",
               why:  \"You're best suited for teaching scalable skills to a focused, paying audience.\" },
        B5:  { name: \"Tech Startup\",
               why:  \"You're built for high-leverage, high-risk software ventures with fast scaling.\" },
        B6:  { name: \"Franchise\",
               why:  \"You're best suited for proven systems with operational discipline and committed capital.\" },
        B7:  { name: \"Passive Income\",
               why:  \"You're best suited for cash-flow assets and automated digital products.\" },
        B8:  { name: \"Local Retail\",
               why:  \"You're best suited for community-rooted, brick-and-mortar businesses.\" },
        B9:  { name: \"Personal Brand\",
               why:  \"You're best suited for audience-led ventures where credibility compounds over time.\" },
        B10: { name: \"Side Hustle\",
               why:  \"You're best suited for flexible, low-commitment income streams alongside your main work.\" },
    };
    const CAT_KEYS = Object.keys(CATEGORIES);

    /* ---------- 12-question bank ----------
       Each option carries a `weights` map of category -> points.
       Hard-filter questions also expose convenient labels via
       FILTER_INDEX below.
    */
    const QUESTIONS = [
        // Q1 — Investment (Budget)  [HARD FILTER]
        { phase: \"Budget\", question: \"How much can you invest upfront?\", options: [
            { label: \"Under ₹50,000\",          weights: { B10: 4, B7: 2, B2: 2, B1: 2, B9: 2 } },
            { label: \"₹50,000 – ₹5 lakh\",      weights: { B1: 3, B2: 3, B3: 2, B4: 2, B9: 1 } },
            { label: \"₹5 lakh – ₹25 lakh\",     weights: { B3: 3, B4: 2, B5: 2, B6: 2, B8: 2 } },
            { label: \"Over ₹25 lakh\",          weights: { B5: 4, B6: 4, B8: 3, B7: 2 } },
        ]},
        // Q2 — Risk appetite       [HARD FILTER]
        { phase: \"Risk\", question: \"Risk you're willing to take:\", options: [
            { label: \"Low — protect what I have\",   weights: { B1: 3, B7: 3, B10: 2, B8: 2 } },
            { label: \"Moderate\",                    weights: { B1: 2, B3: 2, B4: 2, B6: 2, B2: 1 } },
            { label: \"High — calculated bets\",      weights: { B3: 3, B5: 2, B9: 2, B2: 2 } },
            { label: \"Very high — go big\",          weights: { B5: 4, B9: 3, B3: 2 } },
        ]},
        // Q3 — Primary skill (Skills)
        { phase: \"Skills\", question: \"Your strongest skill area:\", options: [
            { label: \"Creative — design, writing, content\", weights: { B2: 4, B9: 3, B4: 1 } },
            { label: \"Technical — coding, data, product\",   weights: { B5: 4, B7: 2, B3: 2 } },
            { label: \"People — sales, leadership, teaching\", weights: { B1: 3, B4: 3, B6: 2, B9: 2 } },
            { label: \"Operational — logistics, ops, finance\", weights: { B6: 3, B8: 3, B3: 2, B7: 1 } },
        ]},
        // Q4 — Working style (Skills)
        { phase: \"Skills\", question: \"You're at your best when you're…\", options: [
            { label: \"Communicating ideas to many\",  weights: { B4: 3, B9: 3, B2: 1 } },
            { label: \"Building or making things\",    weights: { B2: 3, B3: 2, B5: 2, B7: 1 } },
            { label: \"Negotiating and closing\",      weights: { B3: 3, B8: 2, B1: 2 } },
            { label: \"Analysing and strategising\",   weights: { B5: 3, B7: 2, B1: 1 } },
        ]},
        // Q5 — Time horizon (Time)
        { phase: \"Time\", question: \"Your time horizon for full-time commitment:\", options: [
            { label: \"I want full-time independence now\",   weights: { B1: 3, B5: 2, B8: 2, B3: 1 } },
            { label: \"Side income only — keep my day job\",  weights: { B10: 4, B7: 3 } },
            { label: \"Eventually full-time, building first\", weights: { B3: 3, B4: 2, B9: 2 } },
            { label: \"Flexible — see how it grows\",          weights: { B2: 2, B10: 2, B9: 1 } },
        ]},
        // Q6 — Growth mindset (Growth)
        { phase: \"Growth\", question: \"How fast do you want to grow?\", options: [
            { label: \"Slow & steady, sustainable\",          weights: { B1: 3, B7: 3, B10: 1 } },
            { label: \"Fast scaling, aggressive\",            weights: { B5: 4, B3: 3, B9: 2 } },
            { label: \"Replicate across geographies\",        weights: { B6: 4, B8: 2, B3: 1 } },
            { label: \"Passion first — profit follows\",      weights: { B2: 3, B4: 2, B9: 1 } },
        ]},
        // Q7 — Customer model (Skills/Growth)
        { phase: \"Skills\", question: \"How do you prefer to reach customers?\", options: [
            { label: \"One-to-many online\",                  weights: { B3: 3, B4: 3, B9: 3 } },
            { label: \"One-on-one premium relationships\",    weights: { B1: 4, B2: 2 } },
            { label: \"Walk-in retail or franchise\",         weights: { B6: 3, B8: 4 } },
            { label: \"Hands-off / automated\",               weights: { B7: 4, B3: 2 } },
        ]},
        // Q8 — Hours per week     [HARD FILTER]
        { phase: \"Time\", question: \"Hours per week you can commit:\", options: [
            { label: \"2–4 hours\",                           weights: { B10: 3, B7: 2 } },
            { label: \"5–15 hours\",                          weights: { B10: 2, B2: 2, B9: 2, B7: 1 } },
            { label: \"16–30 hours\",                         weights: { B1: 2, B2: 2, B3: 2, B4: 2 } },
            { label: \"30+ hours / full-time\",               weights: { B1: 3, B3: 2, B5: 2, B8: 2 } },
        ]},
        // Q9 — Online comfort (Skills)
        { phase: \"Skills\", question: \"Your comfort with operating online:\", options: [
            { label: \"Native digital — I live online\",      weights: { B3: 3, B5: 2, B9: 2, B7: 2 } },
            { label: \"Comfortable\",                         weights: { B4: 2, B10: 2, B2: 2 } },
            { label: \"Mixed — half offline\",                weights: { B1: 2, B2: 1, B6: 1 } },
            { label: \"Prefer offline & in-person\",          weights: { B6: 3, B8: 3, B1: 2 } },
        ]},
        // Q10 — Income goal (Growth/Time)
        { phase: \"Growth\", question: \"What does success look like financially?\", options: [
            { label: \"Stable, predictable income\",          weights: { B1: 3, B6: 2, B8: 2, B7: 2 } },
            { label: \"Aggressive growth, big upside\",       weights: { B5: 4, B3: 3, B9: 2 } },
            { label: \"Passive cash-flow\",                   weights: { B7: 4, B10: 2 } },
            { label: \"Creative fulfilment over money\",      weights: { B2: 4, B4: 2, B9: 1 } },
        ]},
        // Q11 — Ownership style (Growth)
        { phase: \"Growth\", question: \"Preferred ownership style:\", options: [
            { label: \"Solo operator\",                       weights: { B1: 3, B2: 2, B7: 2, B10: 2 } },
            { label: \"Small team\",                          weights: { B3: 3, B4: 2, B9: 2, B2: 1 } },
            { label: \"Multi-location operations\",           weights: { B6: 4, B8: 3 } },
            { label: \"VC-backed, big-team\",                 weights: { B5: 4, B3: 1 } },
        ]},
        // Q12 — Long-term vision (Growth)
        { phase: \"Growth\", question: \"Your long-term vision:\", options: [
            { label: \"Build a recognisable brand\",          weights: { B2: 3, B9: 3, B5: 1 } },
            { label: \"Steady cash-flow business\",           weights: { B1: 3, B7: 2, B8: 2 } },
            { label: \"Scalable empire\",                     weights: { B3: 3, B5: 3, B6: 2 } },
            { label: \"Help and educate others\",             weights: { B4: 4, B9: 2 } },
        ]},
    ];

    // Hard-filter cheat-sheet (zero-based question index)
    const FILTER_INDEX = { investment: 0, risk: 1, hours: 7 };

    /* ---------- State ---------- */
    let root          = null;
    let scores        = freshScores();
    let answerLog     = [];
    let currentIndex  = 0;
    let pendingAnswer = null;

    function freshScores() {
        return CAT_KEYS.reduce((o, k) => ((o[k] = 0), o), {});
    }

    /* ---------- Public ---------- */
    function mount(rootEl) {
        if (!rootEl) return;
        root = rootEl;
        reset();
    }

    function reset() {
        scores        = freshScores();
        answerLog     = [];
        currentIndex  = 0;
        pendingAnswer = null;
        Profile.setResult(\"business\", null);
        renderQuestion();
    }

    /* ---------- Render ---------- */
    function renderQuestion() {
        const q       = QUESTIONS[currentIndex];
        const stepNum = currentIndex + 1;
        const total   = QUESTIONS.length;
        const percent = (stepNum / total) * 100;
        const isLast  = currentIndex === total - 1;

        root.innerHTML = `
            <div class=\"quiz-card business-card\" data-testid=\"business-quiz-card\">
                <div class=\"quiz-progress\">
                    <div class=\"quiz-progress__meta\">
                        <span class=\"quiz-progress__label\">${q.phase} · Question ${stepNum} of ${total}</span>
                        <span class=\"quiz-progress__pct\">${Math.round(percent)}%</span>
                    </div>
                    <div class=\"quiz-progress__track\">
                        <div class=\"quiz-progress__fill\" style=\"width:${percent}%\"></div>
                    </div>
                </div>

                <h3 class=\"quiz-question\" data-testid=\"business-question\">${q.question}</h3>

                <div class=\"quiz-options\" role=\"radiogroup\" aria-label=\"answer options\">
                    ${q.options.map((opt, i) => `
                        <button class=\"quiz-option business-option\" type=\"button\" role=\"radio\"
                            aria-checked=\"false\" data-index=\"${i}\"
                            data-testid=\"business-option-${i}\">
                            <span class=\"quiz-option__letter\">${\"ABCD\"[i]}</span>
                            <span class=\"quiz-option__label\">${opt.label}</span>
                        </button>
                    `).join(\"\")}
                </div>

                <div class=\"quiz-actions\">
                    <button class=\"primary-button quiz-next business-next\" type=\"button\"
                        disabled data-testid=\"business-next-btn\">
                        ${isLast ? \"See My Match\" : \"Next\"}
                    </button>
                </div>
            </div>
        `;

        bindEvents();
    }

    function bindEvents() {
        const optionButtons = root.querySelectorAll(\".business-option\");
        const nextBtn       = root.querySelector(\".business-next\");

        optionButtons.forEach((btn) => {
            btn.addEventListener(\"click\", () => {
                optionButtons.forEach((b) => {
                    b.classList.remove(\"is-selected\");
                    b.setAttribute(\"aria-checked\", \"false\");
                });
                btn.classList.add(\"is-selected\");
                btn.setAttribute(\"aria-checked\", \"true\");
                pendingAnswer = parseInt(btn.dataset.index, 10);
                nextBtn.disabled = false;
            });
        });

        nextBtn.addEventListener(\"click\", handleNext);
    }

    /* ---------- Scoring ---------- */
    function handleNext() {
        if (pendingAnswer === null) return;

        const q   = QUESTIONS[currentIndex];
        const opt = q.options[pendingAnswer];

        Object.entries(opt.weights || {}).forEach(([cat, pts]) => {
            scores[cat] += pts;
        });
        answerLog[currentIndex] = pendingAnswer;

        pendingAnswer = null;
        currentIndex += 1;

        if (currentIndex >= QUESTIONS.length) {
            applyConstraintsAndRender();
        } else {
            renderQuestion();
        }
    }

    function applyConstraintsAndRender() {
        // Hard filter: Q1 = A  ->  zero out B5 and B6
        if (answerLog[FILTER_INDEX.investment] === 0) {
            scores.B5 = 0;
            scores.B6 = 0;
        }
        // Multiplier: Q2 = A  ->  multiply B5 by 0.5
        if (answerLog[FILTER_INDEX.risk] === 0) {
            scores.B5 = scores.B5 * 0.5;
        }
        // Bonus: Q8 = A  ->  +5 to B10 and B7
        if (answerLog[FILTER_INDEX.hours] === 0) {
            scores.B10 += 5;
            scores.B7  += 5;
        }

        const totalAll = CAT_KEYS.reduce((s, k) => s + scores[k], 0) || 1;
        const ranked = CAT_KEYS.map((k) => ({
            key:     k,
            name:    CATEGORIES[k].name,
            why:     CATEGORIES[k].why,
            score:   scores[k],
            percent: (scores[k] / totalAll) * 100,
        })).sort((a, b) => b.score - a.score);

        renderResults(ranked);
    }

    /* ---------- Results ---------- */
    function renderResults(ranked) {
        const top3 = ranked.slice(0, 3);
        const top  = top3[0];

        // Publish
        Profile.setResult(\"business\", { top, top3, ranked });

        const top3Markup = top3.map((c, i) => `
            <div class=\"result-block ${i === 0 ? \"result-block--primary\" : \"\"}\"
                data-testid=\"business-rank-${i + 1}\">
                <span class=\"result-block__rank\">${[\"Top match\", \"Second\", \"Third\"][i]}</span>
                <h${i === 0 ? \"3\" : \"4\"} class=\"result-block__name\">${c.name}</h${i === 0 ? \"3\" : \"4\"}>
                <span class=\"result-block__pct\">${c.percent.toFixed(1)}%</span>
            </div>
        `).join(\"\");

        root.innerHTML = `
            <div class=\"quiz-card quiz-card--results business-card\" data-testid=\"business-results\">
                <p class=\"results-eyebrow\">Your Business Match</p>

                ${top3Markup}

                <div class=\"business-why\" data-testid=\"business-why\">
                    <span class=\"result-also__title\">The why</span>
                    <p class=\"business-why__body\">${top.why}</p>
                </div>

                <div class=\"quiz-actions\">
                    <button class=\"primary-button quiz-reset business-reset\" type=\"button\"
                        data-testid=\"business-reset-btn\">
                        Restart Find My Business
                    </button>
                </div>
            </div>
        `;

        root.querySelector(\".business-reset\").addEventListener(\"click\", reset);
    }

    return { mount };
})();


/* ============================================================
   6. FINAL SUMMARY
   ------------------------------------------------------------
   A floating CTA appears the moment all three quizzes have
   been completed. Clicking it opens a fullscreen overlay with
   all three results side-by-side.
   ============================================================ */
const FinalSummary = (function () {
    \"use strict\";

    let fab     = null;
    let overlay = null;

    function init() {
        fab = document.createElement(\"button\");
        fab.type      = \"button\";
        fab.className = \"final-fab\";
        fab.dataset.testid = \"final-summary-fab\";
        fab.innerHTML = `
            <span class=\"final-fab__dot\"></span>
            <span>View Final Summary</span>
        `;
        fab.addEventListener(\"click\", open);
        document.body.appendChild(fab);

        Profile.subscribe(() => {
            const ready = Profile.isComplete();
            fab.classList.toggle(\"is-visible\", ready);
            // Live-refresh the overlay if it's currently open
            if (overlay && overlay.classList.contains(\"is-open\")) {
                refreshOverlay();
            } else if (!ready && overlay) {
                close();
            }
        });
    }

    function open() {
        if (!Profile.isComplete()) return;
        ensureOverlay();
        refreshOverlay();
        overlay.classList.add(\"is-open\");
        document.body.classList.add(\"no-scroll\");
        document.addEventListener(\"keydown\", onKey);
    }

    function close() {
        if (!overlay) return;
        overlay.classList.remove(\"is-open\");
        document.body.classList.remove(\"no-scroll\");
        document.removeEventListener(\"keydown\", onKey);
    }

    function onKey(e) {
        if (e.key === \"Escape\") close();
    }

    function ensureOverlay() {
        if (overlay) return;
        overlay = document.createElement(\"div\");
        overlay.className = \"final-overlay\";
        overlay.dataset.testid = \"final-summary-overlay\";
        overlay.innerHTML = `
            <div class=\"final-overlay__backdrop\" data-close=\"1\"></div>
            <div class=\"final-overlay__panel\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Final summary\">
                <button class=\"final-overlay__close\" type=\"button\"
                    data-testid=\"final-summary-close\" aria-label=\"Close\">×</button>
                <header class=\"final-overlay__header\">
                    <p class=\"final-overlay__eyebrow\">Your Profile</p>
                    <h2 class=\"final-overlay__title\">Three quizzes, one snapshot</h2>
                </header>
                <div class=\"final-overlay__grid\" data-testid=\"final-summary-body\"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector(\".final-overlay__close\").addEventListener(\"click\", close);
        overlay.addEventListener(\"click\", (e) => {
            if (e.target.dataset.close) close();
        });
    }

    function refreshOverlay() {
        const grid = overlay.querySelector(\".final-overlay__grid\");
        const data = Profile.getAll();

        grid.innerHTML = `
            ${cineCard(data.cineprofile)}
            ${vacationCard(data.vacation)}
            ${businessCard(data.business)}
        `;
    }

    function cineCard(c) {
        if (!c) return \"\";
        return `
            <article class=\"final-card final-card--cine\" data-testid=\"final-cine\">
                <span class=\"final-card__chip\">CineProfile</span>
                <h3 class=\"final-card__title\">${c.top.name}</h3>
                <p class=\"final-card__pct\">${c.top.percent.toFixed(1)}%</p>
                <ul class=\"final-card__list\">
                    <li><span>Secondary</span><span>${c.second.name} · ${c.second.percent.toFixed(1)}%</span></li>
                    ${c.also.map((g) => `
                        <li><span>${g.name}</span><span>${g.percent.toFixed(1)}%</span></li>
                    `).join(\"\")}
                </ul>
            </article>
        `;
    }

    function vacationCard(v) {
        if (!v) return \"\";
        return `
            <article class=\"final-card final-card--vacation\" data-testid=\"final-vacation\">
                <span class=\"final-card__chip\">Vacation Match</span>
                <h3 class=\"final-card__title\">${v.tripType}</h3>
                <p class=\"final-card__pct\">${Math.round(v.top.percent)}%</p>
                <ul class=\"final-card__list\">
                    <li><span>Style</span><span>${v.style}</span></li>
                    <li><span>Vibe</span><span>${v.vibe}</span></li>
                    <li><span>Top bucket</span><span>${v.top.name}</span></li>
                    <li><span>Then</span><span>${v.second.name}</span></li>
                </ul>
            </article>
        `;
    }

    function businessCard(b) {
        if (!b) return \"\";
        return `
            <article class=\"final-card final-card--business\" data-testid=\"final-business\">
                <span class=\"final-card__chip\">Business Match</span>
                <h3 class=\"final-card__title\">${b.top.name}</h3>
                <p class=\"final-card__pct\">${b.top.percent.toFixed(1)}%</p>
                <p class=\"final-card__why\">${b.top.why}</p>
                <ul class=\"final-card__list\">
                    ${b.top3.slice(1).map((c) => `
                        <li><span>${c.name}</span><span>${c.percent.toFixed(1)}%</span></li>
                    `).join(\"\")}
                </ul>
            </article>
        `;
    }

    return { init, open, close };
})();


/* ============================================================
   7. BOOTSTRAP — mount modules into the dashboard
   ============================================================ */
document.addEventListener(\"DOMContentLoaded\", () => {
    CineProfile.mount(document.getElementById(\"cineprofile-container\"));
    VacationFinder.mount(document.getElementById(\"vacation-container\"));
    BusinessFinder.mount(document.getElementById(\"business-container\"));
    FinalSummary.init();
});
"
Observation: Overwrite successful: /app/script.js
