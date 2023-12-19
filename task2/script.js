import { Octokit } from "https://esm.sh/@octokit/core";

const getLastTenSundays = () => {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const daysToSunday = 1 - currentDayOfWeek;
  const lastTenSundays = Array.from({ length: 10 }, (_, index) => {
    const sundayDate = new Date(today);
    sundayDate.setDate(today.getDate() - index * 7 + daysToSunday);
    sundayDate.setHours(0, 0, 0, 0);
    return sundayDate;
  });

  return lastTenSundays;
};
let stage2DOM = document.querySelector(".stage2");
let stage3DOM = document.querySelector(".stage3");
let formRepoOwnerDOM = document.querySelector(".formRepoOwner");
let formRepoNameDOM = document.querySelector(".formRepoName");
let dialog = document.querySelector(".dialog");
document.querySelector(".stage1form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    stage2DOM.innerHTML = "loading...";

    const octokit = new Octokit();

    let result = await octokit.request("GET /repos/{owner}/{repo}/issues", {
      owner: formRepoOwnerDOM.value,
      repo: formRepoNameDOM.value,
      state: "all",
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (result.data.length < 1) {
      stage2DOM.innerHTML = "github repo does not have any issues";
    } else {
      stage2DOM.innerHTML = "";
      // NOTE
      let noteDOM = document.createElement("p");
      noteDOM.innerHTML =
        "NOTE: fetched latest 100 issues and calculations are done based on those.";
      if (result.data.length === 100) {
        stage2DOM.appendChild(noteDOM);
      }
      // TOTAL open
      let statusOpenCountDOM = document.createElement("p");
      let statusOpenCount = result.data.filter(
        (ele) => ele.state === "open"
      ).length;
      statusOpenCountDOM.innerHTML = "Total Open issues: " + statusOpenCount;
      stage2DOM.appendChild(statusOpenCountDOM);
      //   TOTAL closed
      let statusCloseCountDOM = document.createElement("p");
      let statusCloseCount = result.data.length - statusOpenCount;
      statusCloseCountDOM.innerHTML =
        "Total Closed issues: " + statusCloseCount;
      stage2DOM.appendChild(statusCloseCountDOM);

      let last10Sundays = getLastTenSundays();
      let closureRates = [];
      last10Sundays.forEach((sunday, idx) => {
        let nextSunday = last10Sundays[idx - 1];

        // GROUP title

        let weekGroupDOM = document.createElement("p");
        weekGroupDOM.innerHTML = `Week: ${
          sunday.toISOString().split("T")[0]
        } - ${nextSunday ? nextSunday.toISOString().split("T")[0] : "now"}`;
        stage2DOM.appendChild(weekGroupDOM);

        // newly open
        let statusOpenCountWeeklyDOM = document.createElement("p");
        let statusOpenCountWeekly = result.data.filter((ele) => {
          return nextSunday
            ? new Date(ele.created_at) > sunday &&
                new Date(ele.created_at) < nextSunday
            : new Date(ele.created_at) > sunday;
        }).length;
        statusOpenCountWeeklyDOM.innerHTML =
          "Newly Open issues: " + statusOpenCountWeekly;
        stage2DOM.appendChild(statusOpenCountWeeklyDOM);

        //   newly closed
        let statusCloseCountWeeklyDOM = document.createElement("p");
        let statusCloseCountWeekly = result.data.filter((ele) => {
          return nextSunday
            ? new Date(ele.closed_at) > sunday &&
                new Date(ele.closed_at) < nextSunday
            : new Date(ele.closed_at) > sunday;
        }).length;
        statusCloseCountWeeklyDOM.innerHTML =
          "Newly Closed issues: " + statusCloseCountWeekly;
        stage2DOM.appendChild(statusCloseCountWeeklyDOM);

        //   weekly ratio newly closed vs open
        let weeklyNewlyRatioDOM = document.createElement("p");
        let weeklyNewlyRatio = statusOpenCountWeekly / statusCloseCountWeekly;
        weeklyNewlyRatioDOM.innerHTML =
          "Ratio of newly open / newly closed: " + weeklyNewlyRatio;
        stage2DOM.appendChild(weeklyNewlyRatioDOM);

        //   weekly closure rate

        let openAtStartOfTheWeek = result.data.filter((ele) => {
          return ele.closed_at
            ? new Date(ele.created_at) < sunday &&
                new Date(ele.closed_at) > sunday
            : new Date(ele.created_at) < sunday;
        }).length;

        let weeklyClosureDOM = document.createElement("p");
        let weeklyClosure =
          statusCloseCountWeekly /
          (statusOpenCountWeekly + openAtStartOfTheWeek);
        weeklyClosureDOM.innerHTML = "Closure Rate: " + weeklyClosure;
        stage2DOM.appendChild(weeklyClosureDOM);

        // for avg
        if (!isNaN(weeklyClosure)) {
          closureRates.push(weeklyClosure);
        }
        // HR
        let hrDOM = document.createElement("hr");
        stage2DOM.appendChild(hrDOM);
      });

      // avg closure rate

      let avgClosureRateDOM = document.createElement("p");
      let avgClosureRate = closureRates.length
        ? closureRates.reduce((acc, num) => acc + num, 0) / closureRates.length
        : 0;
      avgClosureRateDOM.innerHTML = "Average Closure Rate: " + avgClosureRate;
      stage2DOM.appendChild(avgClosureRateDOM);

      // button for dialog

      let dialogButtonDOM = document.createElement("button");
      dialogButtonDOM.innerHTML = "Open Model";
      dialogButtonDOM.addEventListener("click", () => {
        dialog.showModal();
      });
      stage2DOM.appendChild(dialogButtonDOM);

      // create table
      stage3DOM.innerHTML = "";
      let tableDOM = document.createElement("table");
      let theadDOM = document.createElement("thead");
      let theadTRDOM = document.createElement("tr");
      let theadTRTH1DOM = document.createElement("th");
      theadTRTH1DOM.innerText = "Creation Date";
      let theadTRTH2DOM = document.createElement("th");
      theadTRTH2DOM.innerText = "Issue Title";
      theadTRDOM.appendChild(theadTRTH1DOM);
      theadTRDOM.appendChild(theadTRTH2DOM);
      theadDOM.appendChild(theadTRDOM);
      tableDOM.appendChild(theadDOM);
      let tbodyDOM = document.createElement("tbody");
      result.data.forEach((issue) => {
        let trDOM = document.createElement("tr");
        let td1DOM = document.createElement("td");
        td1DOM.innerText = new Date(issue.created_at)
          .toISOString()
          .split("T")[0];
        let td2DOM = document.createElement("td");
        td2DOM.innerText = issue.title;

        trDOM.appendChild(td1DOM);
        trDOM.appendChild(td2DOM);
        tbodyDOM.appendChild(trDOM);
      });
      tableDOM.appendChild(tbodyDOM);
      stage3DOM.appendChild(tableDOM);
    }
  } catch (error) {
    stage2DOM.innerHTML = "github repo not found";
    console.log(error);
  }
});
