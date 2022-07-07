/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(["N/record", "N/search", "N/currentRecord", "N/url", "N/https"], /**
 * @param {record} record
 * @param {search} search
 */ function (record, search, currentRecord, url, https) {
  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit() {
    //alert('Consolidated BOL')
  }

  /**
   * Function to be executed after sublist is inserted, removed, or edited.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function sublistChanged(context) {
    var sublists = ["custpage_sub_0", "custpage_sub_1", "custpage_sub_2"];
    //alert(sublists);
    var rec = currentRecord.get();
    var sublistCount = sublists.length;
    var totalWeight = 0;
    var totalCubage = 0;
   // getTotalDims(sublists, context);

   for (var x = 0; x < sublistCount; x++) {
    var sublist = sublists[x];
    // log.debug({ title: "sublist", details: sublist });

    var subLineCount = rec.getLineCount({ sublistId: sublist });
    //log.debug({ title: "subLineCount", details: subLineCount });

    for (var y = 0; y < subLineCount; y++) {
      var mark = rec.getSublistValue({
        sublistId: sublist,
        fieldId: "custpage_subitem_mark",
        line: y
      });
      //alert('mark: ' + mark);
      if (mark == true) {

        var weight = rec.getSublistValue({
          sublistId: sublist,
          fieldId: "custpage_subitem_weight",
          line: y
        });
        var cubage = rec.getSublistValue({
          sublistId: sublist,
          fieldId: "custpage_subitem_totalcubage",
          line: y
        });
        if (!isNaN(parseFloat(weight, 2))) {
          totalWeight = parseFloat(totalWeight) + parseFloat(weight);
        }
        if (!isNaN(parseFloat(cubage, 2))) {
          totalCubage = parseFloat(totalCubage) + parseFloat(cubage);
        }
      }
    }
  }
  //alert('totalWeight: ' + totalWeight);
  rec.setValue({
    fieldId: "custpage_total_weight",
    value: totalWeight.toFixed(2)
  });
  rec.setValue({
    fieldId: "custpage_total_cubage",
    value: totalCubage.toFixed(2)
  });
  }


  return {
    pageInit: pageInit,
    sublistChanged: sublistChanged,
  };
});
