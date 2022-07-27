/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
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

  // var getShipToSelect;

  function pageInit(context) {
    var rec = currentRecord.get();

    var customerBOL = rec.getValue({
      fieldId: "custpage_customer",
    });

    if (customerBOL) {

      var customerSearchResult = searchOnCustomer(customerBOL);

      
      var getShipToSelectHidden = rec.getValue({
        fieldId: "custpage_ship_to_select_hidden",
      });

      var getBillToSelectHidden = rec.getValue({
        fieldId: "custpage_bill_to_select_hidden",
      });


      var { fieldShipToSelect, fieldBillToSelect } = insertRemoveShipBillTo(
        rec,
        customerSearchResult,
        getShipToSelectHidden,
        getBillToSelectHidden
      );

    }

  
    // if (getShipToSelect) {
    //   if (_logValidation(getShipToSelect)) {
    //     var customerSearchResult = searchOnCustomer(customerBOL);

    //     var { addressee, totalAddress, city, state, zipcode } =
    //       getValueFromSearch(customerSearchResult, getShipToSelect);

    //     shipToSelectValue(rec, addressee, totalAddress, city, state, zipcode);
    //   } else {
    //     shipToSelectValue(rec, "", "", "", "", "");
    //   }
    // }

    // var getBillToSelect = rec.getValue({
    //   fieldId: "custpage_bill_to_select",
    // });

    // if (getBillToSelect) {
    //   if (_logValidation(getBillToSelect)) {
    //     var customerSearchResult = searchOnCustomer(customerBOL);

    //     var { addressee, totalAddress, city, state, zipcode } =
    //       getValueFromSearch(customerSearchResult, getBillToSelect);

    //     billToValue(rec, addressee, totalAddress, city, state, zipcode);
    //   } else {
    //     billToValue(rec, "", "", "", "", "");
    //   }
    // }
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
          line: y,
        });
        //alert('mark: ' + mark);
        if (mark == true) {
          var weight = rec.getSublistValue({
            sublistId: sublist,
            fieldId: "custpage_subitem_weight",
            line: y,
          });
          var cubage = rec.getSublistValue({
            sublistId: sublist,
            fieldId: "custpage_subitem_totalcubage",
            line: y,
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
      value: totalWeight.toFixed(2),
    });
    rec.setValue({
      fieldId: "custpage_total_cubage",
      value: totalCubage.toFixed(2),
    });
  }

  function fieldChanged(context) {


    var sublistFieldName = context.fieldId;

    var rec = currentRecord.get();

    var customerBOL = rec.getValue({
      fieldId: "custpage_customer",
    });

    if (sublistFieldName == "custpage_customer") {

      shipToSelectValue(rec, "", "", "", "", "");
      billToValue(rec, "", "", "", "", "");

      var customerSearchResult = searchOnCustomer(customerBOL);

      var { fieldShipToSelect, fieldBillToSelect } = insertRemoveShipBillTo(
        rec,
        customerSearchResult,
      );
    }

    if (sublistFieldName == "custpage_ship_to_select") {

      var getShipToSelect = rec.getValue({
        fieldId: "custpage_ship_to_select",
      });

      rec.setValue({
        fieldId: "custpage_ship_to_select_hidden",
        value: getShipToSelect,
      });

      if (_logValidation(getShipToSelect)) {
        var customerSearchResult = searchOnCustomer(customerBOL);

        var { addressee, totalAddress, city, state, zipcode } =
          getValueFromSearch(customerSearchResult, getShipToSelect);

        shipToSelectValue(rec, addressee, totalAddress, city, state, zipcode);
      }
       else {
        shipToSelectValue(rec, "", "", "", "", "");
      }
    }

    if (sublistFieldName == "custpage_bill_to_select") {
      var getBillToSelect = rec.getValue({
        fieldId: "custpage_bill_to_select",
      });

      rec.setValue({
        fieldId: "custpage_bill_to_select_hidden",
        value: getBillToSelect,
      });

      if (_logValidation(getBillToSelect)) {
        var customerSearchResult = searchOnCustomer(customerBOL);

        var { addressee, totalAddress, city, state, zipcode } =
          getValueFromSearch(customerSearchResult, getBillToSelect);

        billToValue(rec, addressee, totalAddress, city, state, zipcode);
      } else {
        billToValue(rec, "", "", "", "", "");
      }
    }
  }

  return {
    pageInit: pageInit,
    sublistChanged: sublistChanged,
    fieldChanged: fieldChanged,
  };

  function billToValue(rec, addressee, totalAddress, city, state, zipcode) {
    rec.setValue({
      fieldId: "custpage_billtoname",
      value: addressee,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });

    rec.setValue({
      fieldId: "custpage_billtoaddress",
      value: totalAddress,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });

    rec.setValue({
      fieldId: "custpage_billtocity",
      value: city,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });

    rec.setValue({
      fieldId: "custpage_billtostate",
      value: state,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });

    rec.setValue({
      fieldId: "custpage_billtozip",
      value: zipcode,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });
  }

  function shipToSelectValue(
    rec,
    addressee,
    totalAddress,
    city,
    state,
    zipcode
  ) {
    rec.setValue({
      fieldId: "custpage_shiptoname",
      value: addressee || "",
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });
    //}
    //if(_logValidation(totalAddress)){
    rec.setValue({
      fieldId: "custpage_shiptoaddress",
      value: totalAddress,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });
    //}
    //if(_logValidation(city)){
    rec.setValue({
      fieldId: "custpage_shiptocity",
      value: city,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });
    //}
    //if(_logValidation(state)){
    rec.setValue({
      fieldId: "custpage_shiptostate",
      value: state,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });
    //}
    //if(_logValidation(zipcode)){
    rec.setValue({
      fieldId: "custpage_shiptozip",
      value: zipcode,
      ignoreFieldChange: true,
      forceSyncSourcing: true,
    });
  }

  function getValueFromSearch(customerSearchResult, getShipToSelect) {
    if(_logValidation(customerSearchResult)){

    for (let j = 0; j < customerSearchResult.length; j++) {
      var addressee = customerSearchResult[j].getValue({
        name: "addressee",
        join: "Address",
        label: "Addressee",
      });

      if (addressee == getShipToSelect) {
        let address1 = customerSearchResult[j].getValue({
          name: "address1",
          join: "Address",
          label: "Address 1",
        });
        let address2 = customerSearchResult[j].getValue({
          name: "address2",
          join: "Address",
          label: "Address 2",
        });
        var city = customerSearchResult[j].getValue({
          name: "city",
          join: "Address",
          label: "City",
        });
        var state = customerSearchResult[j].getValue({
          name: "state",
          join: "Address",
          label: "State/Province",
        });
        var zipcode = customerSearchResult[j].getValue({
          name: "zipcode",
          join: "Address",
          label: "Zip Code",
        });

        var totalAddress = address1 + " " + address2;
      }
    }
    return { addressee, totalAddress, city, state, zipcode };
  }
  }

  function insertRemoveShipBillTo(rec, customerSearchResult, getShipToSelectHidden, getBillToSelectHidden) {

    var fieldShipToSelect = rec.getField({
      fieldId: "custpage_ship_to_select",
    });

    var fieldBillToSelect = rec.getField({
      fieldId: "custpage_bill_to_select",
    });

    //  rec.setValue({
    //     fieldId: "custpage_ship_to_select",
    //     value: ''
    //   });

    // rec.setValue({
    //     fieldId: "custpage_bill_to_select",
    //     value: ''
    //   });
    let fieldGetSelect = fieldShipToSelect.getSelectOptions();
    let fieldBillSelect = fieldBillToSelect.getSelectOptions();

    if(_logValidation(fieldGetSelect)){

    for (let i = 1; i < fieldGetSelect.length; i++) {
      fieldShipToSelect.removeSelectOption({
        value: fieldGetSelect[i].value,
      });

      fieldBillToSelect.removeSelectOption({
        value: fieldBillSelect[i].value,
      });
    }
  }
    //  fieldShipToSelect.removeSelectOption({
    //    value: '',
    //  });

    //  fieldBillToSelect.removeSelectOption({
    //   value: '',
    // });

    // fieldShipToSelect.insertSelectOption({
    //   value: "",
    //   text: "",
    // });

    // fieldBillToSelect.insertSelectOption({
    //   value: "",
    //   text: "",
    // });

    if(_logValidation(customerSearchResult)){

    for (let i = 0; i < customerSearchResult.length; i++) {
      var addressee = customerSearchResult[i].getValue({
        name: "addressee",
        join: "Address",
        label: "Addressee",
      });

      fieldShipToSelect.insertSelectOption({
        value: addressee,
        text: addressee,
      });

      fieldBillToSelect.insertSelectOption({
        value: addressee,
        text: addressee,
      });
    }
  }


  if(_logValidation(getShipToSelectHidden)){
  rec.setValue({
    fieldId: "custpage_ship_to_select",
    value: getShipToSelectHidden,
    ignoreFieldChange: true,
    forceSyncSourcing: true,
  });
}

  if(_logValidation(getBillToSelectHidden)){
  rec.setValue({
    fieldId: "custpage_bill_to_select",
    value: getBillToSelectHidden,
    ignoreFieldChange: true,
    forceSyncSourcing: true,
  });
}

    return { fieldShipToSelect, fieldBillToSelect };
  }

  function searchOnCustomer(customerBOL) {

    if(_logValidation(customerBOL)){

    var customerSearchObj = search.create({
      type: "customer",

      filters: [["internalid", "anyof", customerBOL]],

      columns: [
        search.createColumn({
          name: "addressee",
          join: "Address",
          label: "Addressee",
        }),
        search.createColumn({
          name: "address1",
          join: "Address",
          label: "Address 1",
        }),
        search.createColumn({
          name: "address2",
          join: "Address",
          label: "Address 2",
        }),
        search.createColumn({
          name: "city",
          join: "Address",
          label: "City",
        }),
        search.createColumn({
          name: "state",
          join: "Address",
          label: "State/Province",
        }),
        search.createColumn({
          name: "country",
          join: "Address",
          label: "Country",
        }),
        search.createColumn({
          name: "zipcode",
          join: "Address",
          label: "Zip Code",
        }),
        search.createColumn({
          name: "addressinternalid",
          join: "Address",
          label: "Address Internal ID",
        }),
      ],
    });

    var customerSearchResult = customerSearchObj.run().getRange(0, 1000);
    return customerSearchResult;
  }
  }

  function _logValidation(value) {
    if (
      value != null &&
      value != "" &&
      value != "null" &&
      value != undefined &&
      value != "undefined" &&
      value != "@NONE@" &&
      value != "NaN"
    ) {
      return true;
    } else {
      return false;
    }
  }
});
