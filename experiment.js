/*
  Prolific mini pilot: economic decision preferences
  Purpose: test Prolific IDs, DataPipe condition assignment, several jsPsych response formats, and OSF data saving.
*/

const DATAPIPE_EXPERIMENT_ID = "2RInaGI34Bnq";

// Add your Prolific completion code later. Leave blank while only testing OSF saving.
const PROLIFIC_COMPLETION_CODE = "C3SAL531";

const jsPsych = initJsPsych({
  use_webaudio: false,
  on_finish: function () {
    console.log("Final jsPsych data CSV:", jsPsych.data.get().csv());
  }
});

const experimentStartPerf = performance.now();

let fullscreenAbortArmed = false;
let plannedFullscreenExit = false;

function currentFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
}

const prolific_pid = jsPsych.data.getURLVariable("PROLIFIC_PID") || "missing";
const study_id = jsPsych.data.getURLVariable("STUDY_ID") || "missing";
const session_id = jsPsych.data.getURLVariable("SESSION_ID") || jsPsych.randomization.randomID(12);
const subject_id = prolific_pid !== "missing" ? prolific_pid : jsPsych.randomization.randomID(10);
const data_filename = `${subject_id}_${session_id}_${Date.now()}_data.csv`;

function desktopCheck() {
  const ua = navigator.userAgent || "";
  const mobileLike = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const smallWindow = window.innerWidth < 900 || window.innerHeight < 600;
  return {
    pass: !mobileLike && !smallWindow,
    mobileLike,
    smallWindow,
    windowInnerWidth: window.innerWidth,
    windowInnerHeight: window.innerHeight
  };
}

const device = desktopCheck();

jsPsych.data.addProperties({
  Subject: subject_id,
  prolific_pid: prolific_pid,
  study_id: study_id,
  session_id: session_id,
  data_filename: data_filename,
  platform: "github_pages_datapipe_osf",
  experiment_name: "prolific_mini_pilot_economic_decision",
  datapipe_experiment_id: DATAPIPE_EXPERIMENT_ID,
  screen_width: window.screen.width,
  screen_height: window.screen.height,
  window_inner_width: window.innerWidth,
  window_inner_height: window.innerHeight,
  device_check_pass: device.pass ? 1 : 0,
  device_mobile_like: device.mobileLike ? 1 : 0,
  device_small_window: device.smallWindow ? 1 : 0,
  user_agent: navigator.userAgent,
  timezone_offset_minutes: new Date().getTimezoneOffset()
});

const conditionTable = [
  {
    datapipe_condition: 0,
    condition_label: "condition_1_low_stakes",
    decision_1: {
      decision_domain: "risk_probability",
      scenario: "Imagine that you can choose between two investment options.",
      question: "Which option would you prefer?",
      left: "50% chance to win $1.00,\n50% chance to win $0.00",
      right: "Sure gain of $0.40"
    },
    decision_2: {
      decision_domain: "intertemporal_choice",
      scenario: "Imagine that you can choose between two reward options.",
      question: "Which option would you prefer?",
      left: "Receive $0.40 today",
      right: "Receive $0.60 in 7 days"
    }
  },
  {
    datapipe_condition: 1,
    condition_label: "condition_2_delayed_larger",
    decision_1: {
      decision_domain: "risk_probability",
      scenario: "Imagine that you can choose between two investment options.",
      question: "Which option would you prefer?",
      left: "30% chance to win $2.00,\n60% chance to win $0.00",
      right: "Sure gain of $0.40"
    },
    decision_2: {
      decision_domain: "intertemporal_choice",
      scenario: "Imagine that you can choose between two reward options.",
      question: "Which option would you prefer?",
      left: "Receive $1.20 in 30 days",
      right: "Receive $0.40 today"
    }
  },
  {
    datapipe_condition: 2,
    condition_label: "condition_3_lottery_large_prize",
    decision_1: {
      decision_domain: "risk_probability",
      scenario: "Imagine that you can choose between two investment options.",
      question: "Which option would you prefer?",
      left: "Sure gain of $0.40",
      right: "5% chance to win $20.00,\n95% chance to win $0.00"
    },
    decision_2: {
      decision_domain: "intertemporal_choice",
      scenario: "Imagine that you can choose between two reward options.",
      question: "Which option would you prefer?",
      left: "Receive $5.00 in 180 days",
      right: "Receive $0.40 today"
    }
  }
];

function shellHtml(innerHtml, topTitle = "Economic Decision Preference Study", extraClass = "") {
  return `
    <div class="study-shell ${extraClass}">
      <div class="qualtrics-topbar">${topTitle}</div>
      <div class="qualtrics-card">${innerHtml}</div>
    </div>
  `;
}

function handleFullscreenChange() {
  if (fullscreenAbortArmed && !plannedFullscreenExit && !currentFullscreenElement()) {
    fullscreenAbortArmed = false;
    jsPsych.data.addProperties({
      fullscreen_exit_abort: 1,
      fullscreen_exit_abort_time_ms: Math.round(performance.now() - experimentStartPerf)
    });
    jsPsych.endExperiment(shellHtml(`
      <h2 class="intro-title">The study has ended.</h2>
      <p class="warning">You exited fullscreen mode during the fullscreen decision section.</p>
      <p>Please return this study on Prolific. Do not submit a completion code.</p>
    `, "Economic Decision Preference Study", "abort-shell"));
  }
}

document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);

function choiceHtml(decision) {
  return shellHtml(`
    <div class="decision-title">${decision.scenario}</div>
    <div class="decision-question">${decision.question}</div>
    <div class="key-hint">Press ← or → to choose.</div>
    <div class="choice-grid">
      <div class="choice-card" id="decision-left-card">
        <div class="choice-key">← Left option</div>
        <div class="choice-text">${decision.left}</div>
      </div>
      <div class="choice-card" id="decision-right-card">
        <div class="choice-key">Right option →</div>
        <div class="choice-text">${decision.right}</div>
      </div>
    </div>
  `, "Economic Decision Preference Study", "decision-shell");
}

function makeDecisionTrial(decision, decisionNumber) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: choiceHtml(decision),
    choices: "NO_KEYS",
    data: {
      phase: "keyboard_decision",
      decision_number: decisionNumber,
      decision_domain: decision.decision_domain,
      decision_left_option: decision.left,
      decision_right_option: decision.right,
      response_mapping: "ArrowLeft_left_ArrowRight_right",
      feedback_delay_ms: 1000
    },
    on_load: function () {
      const pageStart = performance.now();
      let responded = false;

      const finishAfterFeedback = function (event) {
        if (responded) return;
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

        event.preventDefault();
        responded = true;
        document.removeEventListener("keydown", finishAfterFeedback);

        const rt = Math.round(performance.now() - pageStart);
        const choice_side = event.key === "ArrowLeft" ? "left" : "right";
        const chosen_option = choice_side === "left" ? decision.left : decision.right;
        const selectedCard = document.getElementById(choice_side === "left" ? "decision-left-card" : "decision-right-card");
        if (selectedCard) selectedCard.classList.add("choice-card-selected");

        setTimeout(function () {
          jsPsych.finishTrial({
            rt: rt,
            response: event.key,
            choice_key: event.key,
            choice_side: choice_side,
            chosen_option: chosen_option,
            decision_rt: rt,
            feedback_delay_ms: 1000
          });
        }, 1000);
      };

      document.addEventListener("keydown", finishAfterFeedback);
    }
  };
}

function collectFormData(form) {
  const formData = new FormData(form);
  const response = {};
  formData.forEach(function (value, key) {
    response[key] = value;
  });
  return response;
}

function singleChoiceQuestionsTrial() {
  const riskOptions = [
    { value: 1, label: "1 - Not willing at all" },
    { value: 2, label: "2 - Slightly willing" },
    { value: 3, label: "3 - Moderately willing" },
    { value: 4, label: "4 - Very willing" },
    { value: 5, label: "5 - Extremely willing" }
  ];

  const impatienceOptions = [
    { value: 1, label: "1 - Not impatient at all" },
    { value: 2, label: "2 - Slightly impatient" },
    { value: 3, label: "3 - Moderately impatient" },
    { value: 4, label: "4 - Very impatient" },
    { value: 5, label: "5 - Extremely impatient" }
  ];

  const html = shellHtml(`
    <form id="single-choice-form">
      <p class="muted">Please answer the following questions.</p>

      <div class="form-question single-choice-question">
        <div class="question-text">1. In general, how willing are you to take risks?</div>
        <div class="single-choice-list" role="radiogroup" aria-label="risk willingness">
          ${riskOptions.map(o => `
            <label class="single-choice-option">
              <input type="radio" name="risk_willing_5" value="${o.value}" required>
              <span>${o.label}</span>
            </label>
          `).join("")}
        </div>
      </div>

      <div class="form-question single-choice-question">
        <div class="question-text">2. How impatient do you feel when waiting for a delayed reward?</div>
        <div class="single-choice-list" role="radiogroup" aria-label="delay impatience">
          ${impatienceOptions.map(o => `
            <label class="single-choice-option">
              <input type="radio" name="delay_impatience_5" value="${o.value}" required>
              <span>${o.label}</span>
            </label>
          `).join("")}
        </div>
      </div>

      <button type="submit" class="form-submit">Next</button>
      <div id="single-choice-required" class="required-note">Please answer both questions before continuing.</div>
    </form>
  `);

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: html,
    choices: "NO_KEYS",
    data: { phase: "two_single_choice_questions" },
    on_load: function () {
      const pageStart = performance.now();
      const clickLog = [];
      const form = document.getElementById("single-choice-form");
      const warning = document.getElementById("single-choice-required");

      form.querySelectorAll('input[type="radio"]').forEach(function (input) {
        input.addEventListener("click", function () {
          clickLog.push({
            question: input.name,
            value: input.value,
            time_ms_since_page_load: Math.round(performance.now() - pageStart),
            time_ms_since_experiment_start: Math.round(performance.now() - experimentStartPerf)
          });
        });
      });

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!form.checkValidity()) {
          warning.style.display = "block";
          form.reportValidity();
          return;
        }
        const response = collectFormData(form);
        jsPsych.finishTrial({
          risk_willing_5: response.risk_willing_5,
          delay_impatience_5: response.delay_impatience_5,
          rating_click_log: JSON.stringify(clickLog),
          rating_click_count: clickLog.length,
          rating_page_rt: Math.round(performance.now() - pageStart)
        });
      });
    }
  };
}

function sesLadderTrial() {
  const html = shellHtml(`
    <form id="ses-form">
      <div class="form-question">
        <div class="question-text">Please think of this ladder as representing where people stand in society.</div>
        <p>At the top are people who have the most money, education, respected jobs, and social status. At the bottom are people who have the least money, education, respected jobs, and social status.</p>
        <p><b>Where would you place yourself on this ladder?</b></p>
        <div class="ladder-wrap">
          <img src="ladder.png" class="ladder-image" alt="Social status ladder from bottom to top">
          <div class="ladder-scale-block">
            <div class="ladder-scale-anchors-10"><span>Bottom</span><span>Top</span></div>
            <div class="ladder-radio-row" role="radiogroup" aria-label="subjective social status ladder">
              ${[1,2,3,4,5,6,7,8,9,10].map(v => `<label class="radio-tile ladder-radio-tile"><input type="radio" name="ses_ladder_10" value="${v}" required><span>${v}</span></label>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <button type="submit" class="form-submit">Next</button>
      <div id="ses-required" class="required-note">Please select one option before continuing.</div>
    </form>
  `);

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: html,
    choices: "NO_KEYS",
    data: { phase: "ses_ladder" },
    on_load: function () {
      const pageStart = performance.now();
      const clickLog = [];
      const form = document.getElementById("ses-form");
      const warning = document.getElementById("ses-required");

      form.querySelectorAll('input[type="radio"]').forEach(function (input) {
        input.addEventListener("click", function () {
          clickLog.push({
            question: input.name,
            value: input.value,
            time_ms_since_page_load: Math.round(performance.now() - pageStart),
            time_ms_since_experiment_start: Math.round(performance.now() - experimentStartPerf)
          });
        });
      });

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!form.checkValidity()) {
          warning.style.display = "block";
          form.reportValidity();
          return;
        }
        const response = collectFormData(form);
        jsPsych.finishTrial({
          ses_ladder_10: response.ses_ladder_10,
          ses_click_log: JSON.stringify(clickLog),
          ses_click_count: clickLog.length,
          ses_page_rt: Math.round(performance.now() - pageStart)
        });
      });
    }
  };
}

function incomeTrial() {
  const html = shellHtml(`
    <form id="income-form">
      <div class="form-question">
        <div class="question-text">What is your approximate monthly disposable income?</div>
        <p class="muted">Please enter the amount you personally have available to spend or save in a typical month after taxes and necessary fixed expenses.</p>
        <div class="income-row">
          <div>
            <label class="field-label" for="monthly_disposable_income">Amount per month</label>
            <input class="input-text" id="monthly_disposable_income" type="number" name="monthly_disposable_income" min="0" step="1" required placeholder="Enter a number">
          </div>
          <div>
            <label class="field-label" for="income_currency">Currency</label>
            <select class="input-select" id="income_currency" name="income_currency" required>
              <option value="USD" selected>USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="Other">Other local currency</option>
            </select>
          </div>
          <div id="other-currency-wrap" class="other-currency-wrap" style="display: none;">
            <label class="field-label" for="income_currency_other">Please specify currency</label>
            <input class="input-text other-currency-input" id="income_currency_other" type="text" name="income_currency_other" placeholder="e.g., CAD, AUD, CNY">
          </div>
        </div>
      </div>

      <button type="submit" class="form-submit">Submit</button>
      <div id="income-required" class="required-note">Please enter a number and select a currency. If you select “Other local currency,” please specify the currency.</div>
    </form>
  `);

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: html,
    choices: "NO_KEYS",
    data: { phase: "income_fill_in" },
    on_load: function () {
      const pageStart = performance.now();
      const form = document.getElementById("income-form");
      const warning = document.getElementById("income-required");
      const currencySelect = document.getElementById("income_currency");
      const otherWrap = document.getElementById("other-currency-wrap");
      const otherInput = document.getElementById("income_currency_other");

      function updateOtherCurrencyField() {
        const needsOther = currencySelect.value === "Other";
        otherWrap.style.display = needsOther ? "block" : "none";
        otherInput.required = needsOther;
        if (!needsOther) {
          otherInput.value = "";
        }
      }

      currencySelect.addEventListener("change", updateOtherCurrencyField);
      updateOtherCurrencyField();

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        updateOtherCurrencyField();
        if (!form.checkValidity()) {
          warning.style.display = "block";
          form.reportValidity();
          return;
        }
        const response = collectFormData(form);
        jsPsych.finishTrial({
          monthly_disposable_income: response.monthly_disposable_income,
          income_currency: response.income_currency,
          income_currency_other: response.income_currency_other || "",
          income_page_rt: Math.round(performance.now() - pageStart)
        });
      });
    }
  };
}

function finalPageTrial() {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: shellHtml(`
      <h2 class="intro-title">Your response has been saved.</h2>
      <p>Thank you for completing this short study.</p>
      ${PROLIFIC_COMPLETION_CODE
        ? `<p>Click the button below to return to Prolific.</p>`
        : `<p class="muted">No Prolific completion code has been added yet. For OSF-only testing, you may close this page after checking that the data file has appeared on OSF.</p>`}
    `),
    choices: [PROLIFIC_COMPLETION_CODE ? "Return to Prolific" : "Finish"],
    data: { phase: "final_page" },
    on_finish: function () {
      if (PROLIFIC_COMPLETION_CODE) {
        window.location.href = `https://app.prolific.com/submissions/complete?cc=${PROLIFIC_COMPLETION_CODE}`;
      }
    }
  };
}

async function getDatapipeCondition() {
  try {
    const condition = await jsPsychPipe.getCondition(DATAPIPE_EXPERIMENT_ID);
    const conditionNumber = Number(condition);
    if (Number.isInteger(conditionNumber) && conditionNumber >= 0 && conditionNumber < conditionTable.length) {
      return { conditionNumber, source: "datapipe" };
    }
    return { conditionNumber: Math.floor(Math.random() * conditionTable.length), source: "fallback_invalid_datapipe_condition" };
  } catch (error) {
    console.warn("DataPipe condition assignment failed. Falling back to random condition.", error);
    return { conditionNumber: Math.floor(Math.random() * conditionTable.length), source: "fallback_datapipe_error" };
  }
}

async function buildAndRunExperiment() {
  const { conditionNumber, source } = await getDatapipeCondition();
  const conditionInfo = conditionTable[conditionNumber];

  jsPsych.data.addProperties({
    datapipe_condition: conditionNumber,
    datapipe_condition_source: source,
    condition_label: conditionInfo.condition_label
  });

  const timeline = [];

  timeline.push({
    type: jsPsychPreload,
    images: ["ladder.png"],
    continue_after_error: true,
    data: { phase: "preload" }
  });

  if (!device.pass) {
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: shellHtml(`
        <h2 class="intro-title">Desktop or laptop required</h2>
        <p class="warning">This study must be completed on a desktop or laptop computer with a sufficiently large browser window.</p>
        <p>Please return the study on Prolific and do not continue on this device.</p>
        <p class="muted">Detected window size: ${window.innerWidth} × ${window.innerHeight}</p>
      `),
      choices: ["Exit"],
      data: { phase: "device_block" }
    });
    jsPsych.run(timeline);
    return;
  }

  timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: `<div class="fullscreen-message">
      <h2>Economic Decision Preference Study</h2>
      <p>This short study is designed to understand people's economic decision preferences.</p>
      <p>There are no right or wrong answers. Please answer based on your own preferences and current situation.</p>
      <p>You will receive the participation payment after carefully completing the study.</p>
      <p>Please use a desktop or laptop computer. The first decision pages will be completed in fullscreen mode.</p>
    </div>`,
    button_label: "Enter fullscreen and start",
    data: { phase: "fullscreen_start" },
    on_finish: function () {
      plannedFullscreenExit = false;
      fullscreenAbortArmed = true;
      jsPsych.data.addProperties({
        fullscreen_started: currentFullscreenElement() ? 1 : 0
      });
    }
  });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: shellHtml(`
      <h2 class="intro-title">Instructions</h2>
      <p>This study asks about your preferences in several economic decisions.</p>
      <p>For the next two pages, please choose between the left and right options using your keyboard.</p>
      <p><b>Press ← to choose the left option. Press → to choose the right option.</b></p>
      <p class="muted">After you press a key, the selected option will be highlighted briefly before the next page appears.</p>
    `, "Economic Decision Preference Study", "instruction-shell"),
    choices: ["Continue"],
    data: { phase: "instruction_fullscreen" }
  });

  timeline.push(makeDecisionTrial(conditionInfo.decision_1, 1));
  timeline.push(makeDecisionTrial(conditionInfo.decision_2, 2));

  timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: false,
    delay_after: 0,
    data: { phase: "fullscreen_end" },
    on_start: function () {
      plannedFullscreenExit = true;
      fullscreenAbortArmed = false;
    },
    on_finish: function () {
      plannedFullscreenExit = false;
      fullscreenAbortArmed = false;
      jsPsych.data.addProperties({
        fullscreen_completed_normally: 1
      });
    }
  });

  timeline.push(singleChoiceQuestionsTrial());
  timeline.push(sesLadderTrial());
  timeline.push(incomeTrial());

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="study-shell"><div class="qualtrics-card standalone saving-card"><h2>Saving your data...</h2><p>Please do not close this page.</p></div></div>`,
    choices: "NO_KEYS",
    trial_duration: 500,
    data: { phase: "before_save" }
  });

  timeline.push({
    type: jsPsychPipe,
    action: "save",
    experiment_id: DATAPIPE_EXPERIMENT_ID,
    filename: data_filename,
    data_string: () => jsPsych.data.get().csv(),
    wait_message: "<div class='study-shell'><div class='qualtrics-card standalone saving-card'><h2>Saving your data...</h2><p>Please do not close this page.</p></div></div>"
  });

  timeline.push(finalPageTrial());

  jsPsych.run(timeline);
}

buildAndRunExperiment();
