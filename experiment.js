/*
  Experiment 1: Ultimatum game receiver decision with polar-area pie displays.
  Replace DATAPIPE_EXPERIMENT_ID and PROLIFIC_COMPLETION_CODE before launching on Prolific.
*/

const DATAPIPE_EXPERIMENT_ID = "HJEtzT3h5x8N";
const PROLIFIC_COMPLETION_CODE = "REPLACE_WITH_PROLIFIC_COMPLETION_CODE";
const BASE_PAYMENT_USD = 1.00;
const BONUS_DRAW_PERCENT = 10;

const YOU_ORANGE = "#f28e2b";
const OTHER_BLUE = "#22b8cf";

const jsPsych = initJsPsych({
  use_webaudio: false,
  on_finish: function () {
    console.log("Final jsPsych data CSV:", jsPsych.data.get().csv());
  }
});

const experimentStartPerf = performance.now();
let fullscreenAbortArmed = false;
let plannedFullscreenExit = false;
let comprehensionAttempts = 0;
let comprehensionPassed = false;
let excludedForComprehension = false;

function currentFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
}

const prolific_pid = jsPsych.data.getURLVariable("PROLIFIC_PID") || "missing";
const study_id = jsPsych.data.getURLVariable("STUDY_ID") || "missing";
const session_id = jsPsych.data.getURLVariable("SESSION_ID") || jsPsych.randomization.randomID(12);
const subject_id = prolific_pid !== "missing" ? prolific_pid : jsPsych.randomization.randomID(10);
const data_filename = `${subject_id}_${session_id}_${Date.now()}_ultimatum_exp1.csv`;

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
  experiment_name: "ultimatum_game_receiver_polar_area_exp1",
  datapipe_experiment_id: DATAPIPE_EXPERIMENT_ID,
  base_payment_usd: BASE_PAYMENT_USD,
  bonus_draw_percent: BONUS_DRAW_PERCENT,
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

function shellHtml(innerHtml, topTitle = "Ultimatum Game Study", extraClass = "") {
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
      <p class="warning">You exited fullscreen mode during the study.</p>
      <p>Please return this study on Prolific. Do not submit a completion code.</p>
    `, "Ultimatum Game Study", "abort-shell"));
  }
}

document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);

const splits = [
  { split_id: "you10_other90", you: 10, other: 90 },
  { split_id: "you20_other80", you: 20, other: 80 },
  { split_id: "you30_other70", you: 30, other: 70 },
  { split_id: "you40_other60", you: 40, other: 60 },
  { split_id: "you50_other50", you: 50, other: 50 }
];

const areaConditions = [
  { area_condition: "you_larger", you_radius_multiplier: 2, other_radius_multiplier: 1 },
  { area_condition: "other_larger", you_radius_multiplier: 1, other_radius_multiplier: 2 },
  { area_condition: "equal_area", you_radius_multiplier: 1, other_radius_multiplier: 1 }
];

const positions = [
  { position_condition: "top", center_angle_degrees: -90 },
  { position_condition: "right", center_angle_degrees: 0 },
  { position_condition: "bottom", center_angle_degrees: 90 },
  { position_condition: "left", center_angle_degrees: 180 }
];

const colorBalances = [
  { color_balance: "you_orange_other_blue", you_color: YOU_ORANGE, other_color: OTHER_BLUE },
  { color_balance: "you_blue_other_orange", you_color: OTHER_BLUE, other_color: YOU_ORANGE }
];

function buildConditionTable() {
  const rows = [];
  areaConditions.forEach(function (area) {
    splits.forEach(function (split) {
      positions.forEach(function (position) {
        colorBalances.forEach(function (colors) {
          rows.push({
            condition_index: rows.length,
            condition_label: `${area.area_condition}_${split.split_id}_${position.position_condition}_${colors.color_balance}`,
            ...area,
            ...split,
            ...position,
            ...colors
          });
        });
      });
    });
  });
  return rows;
}

const conditionTable = buildConditionTable();

function isDatapipeConfigured() {
  return DATAPIPE_EXPERIMENT_ID && !DATAPIPE_EXPERIMENT_ID.includes("REPLACE_WITH");
}

function isCompletionCodeConfigured() {
  return PROLIFIC_COMPLETION_CODE && !PROLIFIC_COMPLETION_CODE.includes("REPLACE_WITH");
}

async function getDatapipeCondition() {
  if (!isDatapipeConfigured()) {
    return {
      conditionNumber: Math.floor(Math.random() * conditionTable.length),
      source: "fallback_datapipe_not_configured"
    };
  }

  try {
    const condition = await jsPsychPipe.getCondition(DATAPIPE_EXPERIMENT_ID);
    const conditionNumber = Number(condition);
    if (Number.isInteger(conditionNumber) && conditionNumber >= 0 && conditionNumber < conditionTable.length) {
      return { conditionNumber, source: "datapipe" };
    }
    return {
      conditionNumber: Math.floor(Math.random() * conditionTable.length),
      source: "fallback_invalid_datapipe_condition"
    };
  } catch (error) {
    console.warn("DataPipe condition assignment failed. Falling back to random condition.", error);
    return {
      conditionNumber: Math.floor(Math.random() * conditionTable.length),
      source: "fallback_datapipe_error"
    };
  }
}

function polarToCartesian(cx, cy, radius, angleDegrees) {
  const angleRadians = (angleDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + radius * Math.cos(angleRadians),
    y: cy + radius * Math.sin(angleRadians)
  };
}

function sectorPath(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");
}

function labelPosition(cx, cy, radius, startAngle, endAngle, factor) {
  const midAngle = startAngle + (endAngle - startAngle) / 2;
  return polarToCartesian(cx, cy, radius * factor, midAngle);
}

function calloutHtml(cx, cy, sectorRadius, labelRadius, textRadius, startAngle, endAngle, label, amount, color) {
  const midAngle = startAngle + (endAngle - startAngle) / 2;
  const edge = polarToCartesian(cx, cy, sectorRadius + 8, midAngle);
  const elbow = polarToCartesian(cx, cy, labelRadius, midAngle);
  const text = polarToCartesian(cx, cy, textRadius, midAngle);
  const dx = text.x - cx;
  const anchor = Math.abs(dx) < 46 ? "middle" : dx > 0 ? "start" : "end";
  const textOffset = anchor === "middle" ? 0 : dx > 0 ? 18 : -18;

  return `
    <g class="callout-group">
      <text class="callout-text" x="${text.x + textOffset}" y="${text.y}" text-anchor="${anchor}">
        <tspan class="callout-person" x="${text.x + textOffset}" dy="-0.18em">${label}</tspan>
        <tspan class="callout-amount" x="${text.x + textOffset}" dy="1.28em">${amount} cents</tspan>
      </text>
    </g>
  `;
}

function roseChartHtml(condition) {
  const cx = 390;
  const cy = 330;
  const baseRadius = 122;
  const youRadius = baseRadius * condition.you_radius_multiplier;
  const otherRadius = baseRadius * condition.other_radius_multiplier;
  const maxRadius = Math.max(youRadius, otherRadius);
  const labelRadius = maxRadius + 42;
  const textRadius = maxRadius + 132;
  const youAngle = condition.you / 100 * 360;
  const otherAngle = 360 - youAngle;
  const youStart = condition.center_angle_degrees - youAngle / 2;
  const youEnd = condition.center_angle_degrees + youAngle / 2;
  const otherStart = youEnd;
  const otherEnd = youEnd + otherAngle;

  return `
    <svg class="rose-chart" viewBox="0 -80 780 760" role="img" aria-label="Pie chart showing the proposed allocation">
      <path class="sector" d="${sectorPath(cx, cy, otherRadius, otherStart, otherEnd)}" fill="${condition.other_color}"></path>
      <path class="sector" d="${sectorPath(cx, cy, youRadius, youStart, youEnd)}" fill="${condition.you_color}"></path>
      ${calloutHtml(cx, cy, youRadius, labelRadius, textRadius, youStart, youEnd, "you", condition.you, condition.you_color)}
      ${calloutHtml(cx, cy, otherRadius, labelRadius, textRadius, otherStart, otherEnd, "other", condition.other, condition.other_color)}
    </svg>
  `;
}

function exampleRoseChartHtml() {
  return roseChartHtml({
    you: 1,
    other: 99,
    you_radius_multiplier: 1,
    other_radius_multiplier: 1,
    center_angle_degrees: -90,
    you_color: YOU_ORANGE,
    other_color: OTHER_BLUE
  });
}

function collectFormData(form) {
  const formData = new FormData(form);
  const response = {};
  formData.forEach(function (value, key) {
    response[key] = value;
  });
  return response;
}

function desktopGateTrial() {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: shellHtml(`
      <h2 class="intro-title">Desktop or laptop required</h2>
      <p class="warning">This study must be completed on a desktop or laptop computer with a sufficiently large browser window.</p>
      <p>Please return the study on Prolific and do not continue on this device.</p>
      <p class="muted">Detected window size: ${window.innerWidth} x ${window.innerHeight}</p>
    `),
    choices: ["Exit"],
    data: { phase: "device_block" }
  };
}

function instructionTrial() {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: shellHtml(`
      <h2 class="intro-title">Instructions</h2>
      <p>In this study, you will take part in a short economic decision task called the Ultimatum Game.</p>
      <p>You will be the <b>receiver</b>. Another participant, who previously completed the proposer part of this study, has already made a proposal about how to divide <b>100 cents</b> between themself and a receiver.</p>
      <p>On the next decision page, you will see one proposal selected from our existing proposer database. The proposal shows how much money would go to <b>you</b> and how much would go to the <b>other</b> participant.</p>
      <p>Your task is to decide whether to <b>accept</b> or <b>reject</b> the proposal.</p>
      <ul>
        <li>If you accept, you and the other participant receive the amounts shown in the proposal.</li>
        <li>If you reject, both you and the other participant receive 0 cents from this game.</li>
      </ul>
      <p>All participants receive a base payment of <b>$${BASE_PAYMENT_USD.toFixed(2)}</b> for completing the study. In addition, <b>${BONUS_DRAW_PERCENT}% of participants</b> will be randomly selected for real bonus payment. If you are selected, your decision will be matched with a proposal from the existing proposer database, and the outcome will be paid as a Prolific bonus.</p>
      <p>Bonus payments will be processed within <b>two months</b> after data collection is complete.</p>
      <p>Please read carefully and make your decision as if it could determine a real bonus for you and another participant.</p>
    `, "Ultimatum Game Study", "instruction-shell"),
    choices: ["Continue"],
    data: { phase: "instructions", comprehension_attempt_number: comprehensionAttempts + 1 }
  };
}

function comprehensionTrial() {
  const questions = [
    {
      name: "role",
      text: "1. What role will you have in this study?",
      options: [
        { value: "receiver", label: "Receiver" },
        { value: "proposer", label: "Proposer" },
        { value: "observer", label: "Observer" }
      ],
      correct: "receiver"
    },
    {
      name: "accept",
      text: "2. Example: the proposal gives you 1 cent and gives the other participant 99 cents. What happens if you accept this proposal?",
      exampleHtml: `
        <div class="comprehension-example">
          <div class="example-chart">${exampleRoseChartHtml()}</div>
          <div class="example-note"><b>Example proposal:</b> you receive 1 cent; other receives 99 cents.</div>
        </div>
      `,
      options: [
        { value: "shown_amounts", label: "You receive 1 cent, and the other participant receives 99 cents." },
        { value: "both_zero", label: "Both participants receive 0 cents from the game." },
        { value: "you_all", label: "You receive all 100 cents." }
      ],
      correct: "shown_amounts"
    },
    {
      name: "reject",
      text: "3. Example: the proposal gives you 1 cent and gives the other participant 99 cents. What happens if you reject this proposal?",
      exampleHtml: `
        <div class="comprehension-example">
          <div class="example-chart">${exampleRoseChartHtml()}</div>
          <div class="example-note"><b>Example proposal:</b> you receive 1 cent; other receives 99 cents.</div>
        </div>
      `,
      options: [
        { value: "shown_amounts", label: "You receive 1 cent, and the other participant receives 99 cents." },
        { value: "both_zero", label: "Both participants receive 0 cents from the game." },
        { value: "other_all", label: "The other participant receives all 100 cents." }
      ],
      correct: "both_zero"
    },
    {
      name: "bonus",
      text: "4. How are bonus outcomes determined?",
      options: [
        { value: "ten_percent_real", label: "10% of participants are randomly selected, and selected outcomes are paid as Prolific bonuses." },
        { value: "everyone_real", label: "Every participant receives the game outcome as a bonus." },
        { value: "no_real_bonus", label: "The game is hypothetical and no bonuses can be paid." }
      ],
      correct: "ten_percent_real"
    },
    {
      name: "total",
      text: "5. How much money is divided in the game proposal?",
      options: [
        { value: "100_cents", label: "100 cents" },
        { value: "10_dollars", label: "$10" },
        { value: "unknown", label: "The amount is not specified" }
      ],
      correct: "100_cents"
    }
  ];

  const html = shellHtml(`
    <form id="comprehension-form">
      <h2 class="intro-title">Comprehension Check</h2>
      <p class="muted">Please answer these questions before continuing.</p>
      ${questions.map(function (q) {
        return `
          <div class="form-question">
            <div class="question-text">${q.text}</div>
            ${q.exampleHtml || ""}
            <div class="single-choice-list" role="radiogroup" aria-label="${q.name}">
              ${q.options.map(function (o) {
                return `
                  <label class="single-choice-option">
                    <input type="radio" name="${q.name}" value="${o.value}" required>
                    <span>${o.label}</span>
                  </label>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }).join("")}
      <button type="submit" class="form-submit">Submit</button>
      <div id="comprehension-required" class="required-note">Please answer all questions before continuing.</div>
    </form>
  `);

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: html,
    choices: "NO_KEYS",
    data: { phase: "comprehension_check" },
    on_load: function () {
      const pageStart = performance.now();
      const form = document.getElementById("comprehension-form");
      const warning = document.getElementById("comprehension-required");
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!form.checkValidity()) {
          warning.style.display = "block";
          form.reportValidity();
          return;
        }
        comprehensionAttempts += 1;
        const response = collectFormData(form);
        const incorrect = questions
          .filter(q => response[q.name] !== q.correct)
          .map(q => q.name);
        comprehensionPassed = incorrect.length === 0;
        excludedForComprehension = !comprehensionPassed && comprehensionAttempts >= 2;
        jsPsych.finishTrial({
          comprehension_attempt: comprehensionAttempts,
          comprehension_passed: comprehensionPassed ? 1 : 0,
          comprehension_incorrect_items: incorrect.join("|"),
          comprehension_response_json: JSON.stringify(response),
          comprehension_rt: Math.round(performance.now() - pageStart)
        });
      });
    }
  };
}

function warningTrial() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: shellHtml(`
      <h2 class="intro-title">回答错误！</h2>
      <p class="warning">请重新阅读指导语。</p>
    `),
    choices: "NO_KEYS",
    trial_duration: 3000,
    data: { phase: "comprehension_warning" }
  };
}

function exclusionTrial() {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: shellHtml(`
      <h2 class="intro-title">The study has ended.</h2>
      <p class="warning">Based on your comprehension-check responses, you are not eligible to continue this study.</p>
      <p>Please return this study on Prolific. Do not submit a completion code.</p>
    `, "Ultimatum Game Study", "abort-shell"),
    choices: ["Exit"],
    data: { phase: "comprehension_exclusion" },
    on_finish: function () {
      plannedFullscreenExit = true;
      fullscreenAbortArmed = false;
      if (currentFullscreenElement() && document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
}

function decisionTrial(condition) {
  const html = shellHtml(`
    <div class="stimulus-content">
      <div class="offer-title">The other participant proposed this allocation of 100 cents.</div>
      <div class="offer-subtitle">Please decide whether to accept or reject this proposal.</div>
      <div class="rose-wrap">${roseChartHtml(condition)}</div>
      <div class="decision-buttons">
        <button class="decision-button" type="button" data-choice="accept">Accept</button>
        <button class="decision-button" type="button" data-choice="reject">Reject</button>
      </div>
    </div>
  `, "Ultimatum Game Study", "stimulus-shell");

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: html,
    choices: "NO_KEYS",
    data: {
      phase: "ultimatum_decision",
      condition_index: condition.condition_index,
      condition_label: condition.condition_label,
      split_id: condition.split_id,
      you_cents: condition.you,
      other_cents: condition.other,
      area_condition: condition.area_condition,
      you_radius_multiplier: condition.you_radius_multiplier,
      other_radius_multiplier: condition.other_radius_multiplier,
      position_condition: condition.position_condition,
      center_angle_degrees: condition.center_angle_degrees,
      color_balance: condition.color_balance,
      you_color: condition.you_color,
      other_color: condition.other_color
    },
    on_load: function () {
      const pageStart = performance.now();
      const buttons = Array.from(document.querySelectorAll(".decision-button"));
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          buttons.forEach(b => b.disabled = true);
          button.classList.add("selected");
          const choice = button.getAttribute("data-choice");
          setTimeout(function () {
            jsPsych.finishTrial({
              ultimatum_choice: choice,
              accepted: choice === "accept" ? 1 : 0,
              decision_rt: Math.round(performance.now() - pageStart)
            });
          }, 350);
        });
      });
    }
  };
}

function scaleQuestionHtml(name, text, left, right) {
  return `
    <div class="form-question">
      <div class="question-text">${text}</div>
      <div class="scale-anchors"><span>${left}</span><span>${right}</span></div>
      <div class="radio-row" role="radiogroup" aria-label="${name}">
        ${[1,2,3,4,5,6,7].map(v => `
          <label class="radio-tile">
            <input type="radio" name="${name}" value="${v}" required>
            <span>${v}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function questionnaireTrial() {
  const html = shellHtml(`
    <form id="post-form">
      <h2 class="intro-title">Follow-up Questions</h2>
      ${scaleQuestionHtml("fairness_7", "How fair do you think the proposal was?", "1 - Very unfair", "7 - Very fair")}
      ${scaleQuestionHtml("anger_7", "How angry did the proposal make you feel?", "1 - Not angry at all", "7 - Extremely angry")}
      ${scaleQuestionHtml("acceptability_7", "How acceptable did you find this proposal?", "1 - Completely unacceptable", "7 - Completely acceptable")}
      ${scaleQuestionHtml("respect_7", "How respectful did the proposal feel toward you?", "1 - Not respectful at all", "7 - Very respectful")}
      ${scaleQuestionHtml("visual_influence_7", "How much did the visual display influence your impression of the proposal?", "1 - Not at all", "7 - Very much")}
      ${scaleQuestionHtml("clarity_7", "How clear was the display of the allocation?", "1 - Very unclear", "7 - Very clear")}
      <div class="form-question">
        <div class="question-text">In one sentence, what was most important for your decision?</div>
        <textarea class="text-area" name="decision_reason" maxlength="600"></textarea>
      </div>
      <button type="submit" class="form-submit">Submit</button>
      <div id="post-required" class="required-note">Please answer all rating questions before continuing.</div>
    </form>
  `);

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: html,
    choices: "NO_KEYS",
    data: { phase: "post_questionnaire" },
    on_load: function () {
      const pageStart = performance.now();
      const form = document.getElementById("post-form");
      const warning = document.getElementById("post-required");
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!form.checkValidity()) {
          warning.style.display = "block";
          form.reportValidity();
          return;
        }
        const response = collectFormData(form);
        jsPsych.finishTrial({
          fairness_7: response.fairness_7,
          anger_7: response.anger_7,
          acceptability_7: response.acceptability_7,
          respect_7: response.respect_7,
          visual_influence_7: response.visual_influence_7,
          clarity_7: response.clarity_7,
          decision_reason: response.decision_reason || "",
          post_questionnaire_rt: Math.round(performance.now() - pageStart)
        });
      });
    }
  };
}

function localSaveNoticeTrial() {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: shellHtml(`
      <h2 class="intro-title">DataPipe is not configured yet.</h2>
      <p class="warning">This preview run cannot save to OSF/DataPipe because <code>DATAPIPE_EXPERIMENT_ID</code> is still a placeholder.</p>
      <p>The data are available in the browser console for testing. Replace the placeholder before running on Prolific.</p>
    `),
    choices: ["Continue"],
    data: { phase: "datapipe_not_configured_notice" }
  };
}

function savingTrial() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="study-shell"><div class="qualtrics-card standalone saving-card"><h2>Saving your data...</h2><p>Please do not close this page.</p></div></div>`,
    choices: "NO_KEYS",
    trial_duration: 500,
    data: { phase: "before_save" }
  };
}

function pipeSaveTrial() {
  return {
    type: jsPsychPipe,
    action: "save",
    experiment_id: DATAPIPE_EXPERIMENT_ID,
    filename: data_filename,
    data_string: () => jsPsych.data.get().csv(),
    wait_message: "<div class='study-shell'><div class='qualtrics-card standalone saving-card'><h2>Saving your data...</h2><p>Please do not close this page.</p></div></div>"
  };
}

function finalPageTrial() {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: shellHtml(`
      <h2 class="intro-title">Your response has been saved.</h2>
      <p>Thank you for completing this study.</p>
      ${isCompletionCodeConfigured()
        ? `<p>Click the button below to return to Prolific.</p>`
        : `<p class="muted">The Prolific completion code is still a placeholder. Add the real code before launch.</p>`}
    `),
    choices: [isCompletionCodeConfigured() ? "Return to Prolific" : "Finish"],
    data: { phase: "final_page" },
    on_finish: function () {
      plannedFullscreenExit = true;
      fullscreenAbortArmed = false;
      if (currentFullscreenElement() && document.exitFullscreen) {
        document.exitFullscreen();
      }
      if (isCompletionCodeConfigured()) {
        window.location.href = `https://app.prolific.com/submissions/complete?cc=${PROLIFIC_COMPLETION_CODE}`;
      }
    }
  };
}

async function buildAndRunExperiment() {
  const timeline = [];

  if (!device.pass) {
    timeline.push(desktopGateTrial());
    jsPsych.run(timeline);
    return;
  }

  const { conditionNumber, source } = await getDatapipeCondition();
  const conditionInfo = conditionTable[conditionNumber];

  jsPsych.data.addProperties({
    datapipe_condition: conditionNumber,
    datapipe_condition_source: source,
    condition_index: conditionInfo.condition_index,
    condition_label: conditionInfo.condition_label
  });

  timeline.push({
    type: jsPsychPreload,
    images: [],
    continue_after_error: true,
    data: { phase: "preload" }
  });

  timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: `<div class="fullscreen-message">
      <h2>Ultimatum Game Study</h2>
      <p>This study must be completed on a desktop or laptop computer.</p>
      <p>Please enter fullscreen mode to begin. If you exit fullscreen before the study ends, the study will stop automatically.</p>
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

  timeline.push(instructionTrial());
  timeline.push(comprehensionTrial());

  timeline.push({
    timeline: [warningTrial(), instructionTrial(), comprehensionTrial()],
    conditional_function: function () {
      return !comprehensionPassed && !excludedForComprehension;
    }
  });

  timeline.push({
    timeline: [decisionTrial(conditionInfo), questionnaireTrial()],
    conditional_function: function () {
      return comprehensionPassed;
    }
  });

  timeline.push({
    timeline: [savingTrial(), pipeSaveTrial()],
    conditional_function: function () {
      return isDatapipeConfigured() && (comprehensionPassed || excludedForComprehension);
    }
  });

  timeline.push({
    timeline: [localSaveNoticeTrial()],
    conditional_function: function () {
      return !isDatapipeConfigured() && (comprehensionPassed || excludedForComprehension);
    }
  });

  timeline.push({
    timeline: [finalPageTrial()],
    conditional_function: function () {
      return comprehensionPassed;
    }
  });

  timeline.push({
    timeline: [exclusionTrial()],
    conditional_function: function () {
      return excludedForComprehension;
    }
  });

  jsPsych.run(timeline);
}

buildAndRunExperiment();
