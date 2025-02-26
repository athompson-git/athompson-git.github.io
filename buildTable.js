// buildTable.js
// buildTable now accepts three arguments:
// visible_columns: Array of columns to display,
// jsonFile: The JSON data file URL,
// tableId: The id of the table element to build (it must contain a <thead> with a <tr> and a <tbody>)
function buildTable(visible_columns, jsonFile, tableId, titleId) {
  $(document).ready(function(){
    $.getJSON(jsonFile)
      .done(function(data) {
        console.log("JSON loaded successfully from " + jsonFile, data);
        const fieldTypes = data.field_types;
        delete data.field_types;
        
        // Get all keys from fieldTypes
        let columns = Object.keys(fieldTypes);
        
        // Build header row.
        // Find the header row within the specified table.
        let headerRow = $("#" + tableId + " thead tr");
        headerRow.empty();
        headerRow.append(`<th onclick="sortTable(0, '${tableId}')">Experiment Name</th>`);
        columns.forEach((col, index) => {
          if (!visible_columns.includes(col)) return;
          headerRow.append(`<th onclick="sortTable(${index + 1}, '${tableId}')">${col}</th>`);
        });
        
        // Build table body.
        let tableBody = $("#" + tableId + " tbody");
        tableBody.empty();

        // Sorting: "Running" comes first, "Future" second, and all others last.
        let sortedEntries = Object.entries(data).sort((a, b) => {
          let orderMap = { "running": 0, "future": 1 };
          let statusA = (a[1]["Status"] || "").toLowerCase();
          let statusB = (b[1]["Status"] || "").toLowerCase();
          let orderA = (statusA in orderMap) ? orderMap[statusA] : 2;
          let orderB = (statusB in orderMap) ? orderMap[statusB] : 2;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          // If same status group, sort alphabetically by experiment name.
          return a[0].localeCompare(b[0]);
        });

        sortedEntries.forEach(([experiment, details]) => {
          // Determine row color based on "Status"
          let status = details["Status"] || "";
          let rowColor = "";
          if (status === "Running") {
            rowColor = ' style="background-color: rgba(0, 128, 0, 0.1);"';
          } else if (status === "Future") {
            rowColor = ' style="background-color: rgba(255, 255, 0, 0.1);"';
          }
  
          // Mark anomalies
          let anomalies = details["Anomalies?"] || "";
          let anomalyClass = anomalies.trim() !== "" ? "anomaly" : "";
  
          // Get tooltip notes and Inspire link
          let notes = details["Notes"] || "";
          let inspireLink = details["InspireLink"] || "";
          let inspireAnchor = "";
          if (inspireLink.trim() !== "") {
            inspireAnchor = `<a href="${inspireLink}" target="_blank" style="color: blue; text-decoration: underline;">[iN]</a>`;
          }
  
          let rowStr = `<tr class="${anomalyClass}" ${rowColor}>
            <td class="experiment-name">
              ${experiment} ${inspireAnchor}
              ${notes ? `<span class="tooltip">${notes}</span>` : ""}
            </td>`;
  
          // Loop over the standard columns.
          columns.forEach(col => {
            if (!visible_columns.includes(col)) return;
            let cellData = details[col] || "";

            if ((col === "Reference" || col === "Open Data") && cellData) {
              let refs = cellData.split(",").map(ref => {
                let trimmedRef = ref.trim();
                // Trim the display text to a maximum of 40 characters.
                let displayText = trimmedRef;
                if (displayText.length > 35) {
                  displayText = displayText.substring(0, 35) + "...";
                }
                return `<a href="${trimmedRef}" target="_blank">${displayText}</a>`;
              });
              cellData = refs.join("<br>");
            }

            // Apply color coding for beam particle type
            if (col === "Beam Particle") {
              let lowerData = cellData.toLowerCase();
              if (lowerData.includes("proton")) {
                cellData = `<span style="color: red;">${cellData}</span>`;
              } else if (lowerData.includes("electron")) {
                cellData = `<span style="color: blue;">${cellData}</span>`;
              } else if (lowerData.includes("muon")) {
                cellData = `<span style="color: purple;">${cellData}</span>`;
              }
            }
  
            if (col === "POT") {
              let potValue = parseFloat(cellData);
              if (!isNaN(potValue)) {
                cellData = potValue.toExponential(2);
              }
            }
  
            rowStr += `<td>${cellData}</td>`;
          });
          rowStr += "</tr>";
          tableBody.append(rowStr);
        });
  
        $("#search").on("keyup", function() {
          let value = $(this).val().toLowerCase();
          $("#" + tableId + " tbody tr").each(function() {
            let rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.includes(value));
          });
          // If no rows are visible, hide the header; otherwise, show it.
          if ($("#" + tableId + " tbody tr:visible").length === 0) {
            $("#" + tableId + " thead").hide();
            $("#" + titleId).hide();
          } else {
            $("#" + tableId + " thead").show();
            $("#" + titleId).show();
          }
        });
      })
      .fail(function(jqxhr, textStatus, error) {
        console.error("Error loading JSON from " + jsonFile, textStatus, error);
      });
  });
}

// This function sorts the table (by tbody rows) based on column n (0-indexed) in the table with the given tableId.
function sortTable(n, tableId) {
  let table = document.getElementById(tableId);
  let switching = true;
  let dir = "asc";
  let switchcount = 0;
  let rows, i, shouldSwitch; // Declare variables outside the loop

  while (switching) {
    switching = false;
    rows = table.tBodies[0].rows;
    // Loop through all table rows (except the header)
    for (i = 0; i < rows.length - 1; i++) {
      shouldSwitch = false; // Initialize for each pair of rows
      let x = rows[i].getElementsByTagName("TD")[n];
      let y = rows[i + 1].getElementsByTagName("TD")[n];

      if (dir === "asc" && x.innerText.toLowerCase() > y.innerText.toLowerCase()) {
        shouldSwitch = true;
        break;
      } else if (dir === "desc" && x.innerText.toLowerCase() < y.innerText.toLowerCase()) {
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount++;
    } else {
      // If no switching has been done and direction is "asc",
      // set the direction to "desc" and run the loop again.
      if (switchcount === 0 && dir === "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}
