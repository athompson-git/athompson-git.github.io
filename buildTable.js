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
        Object.entries(data).forEach(([experiment, details]) => {
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
  
            if (col === "Reference" && cellData) {
              let refs = cellData.split(",").map(ref => {
                let trimmedRef = ref.trim();
                return `<a href="${trimmedRef}" target="_blank">${trimmedRef}</a>`;
              });
              cellData = refs.join("<br>");
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
  
        // Setup search functionality (if present)
        // $("#search").on("keyup", function() {
        //   let value = $(this).val().toLowerCase();
        //   $("#" + tableId + " tbody tr").each(function() {
        //     let rowText = $(this).text().toLowerCase();
        //     $(this).toggle(rowText.includes(value));
        //   });
        // });
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
