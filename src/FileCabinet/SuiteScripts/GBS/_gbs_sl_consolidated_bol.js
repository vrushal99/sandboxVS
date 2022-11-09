/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */


define([
  "N/record",
  "N/runtime",
  "N/search",
  "N/ui/serverWidget",
  "N/render",
  "N/file",
  "N/xml",
  "N/url",
  "N/ui/message",
], /**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {serverWidget} serverWidget
 */ function (record, runtime, search, serverWidget, render, file, xml, url, message) {
  /**
   * Definition of the Suitelet script trigger point.
   *
   * @param {Object} context
   * @param {ServerRequest} context.request - Encapsulation of the incoming request
   * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
   * @Since 2015.2
   */

  var transRecType;
  var markCheckArr = [];

  function onRequest(context) {
    try {
      var getTransType = context.request.parameters.custpage_transaction_type;

      if (getTransType == "salesorder") {
        transRecType = "salesorder";
      } else if (getTransType == "itemfulfillment") {
        transRecType = "itemfulfillment";
      }


      var { request, parameters } = getParameters(context);
    
      // log.debug('parameters.custpage_radiofield', parameters.custpage_radiofield);
      if (request.method == "GET") {
        context.response.writePage({
          pageObject: mainForm(context),
        });
      } else {
        let output = makeSuiteLetUrl(parameters);
        if (
          parameters.custpage_radiofield == "3" &&
          _logValidation(parameters.custpage_array_of_tabs)
        ) {
          var postDataCon = getSublistDataPDF(parameters, context, true);
          // log.debug('postDataCon', postDataCon)

          var URL = printBOLConsolidated(postDataCon, context);
          //log.debug('URL', URL)
          if(_logValidation(URL) && _logValidation(context)){
          URL = renderConsolidatedPDFNum(URL, context, 1);
          }

          if(_logValidation(URL) && _logValidation(output)){
          context.response.write(
            `<html><head><script>window.open("${URL}")</script></head></html>`
          );

          context.response.write(
            `<html><head><script>window.location.href = '${output}'</script></head></html>`
          );
          }
          else{
            context.response.write(
              `<html><head><script>window.location.href = '${output}'</script></head></html>`
            );

          //   var form = serverWidget.createForm({
          //     title: "Consolidated BOL",
          //   });
       
          //   var {
          //     markCheckItem
          //   } = addBodyFields(form);

          // log.debug('markCheckArr', markCheckArr);
          // markCheckItem.defaultValue = markCheckArr;
          // log.debug('markCheckItem', markCheckItem);

          }
        } else if (
          parameters.custpage_radiofield == "2" &&
          _logValidation(parameters.custpage_array_of_tabs)
        ) {
          var postDataSin = getSublistDataPDF(parameters, context, false);
          var URL = printBOLSinglePdf(postDataSin);
          if(_logValidation(URL) && _logValidation(context)){
          URL = renderConsolidatedPDFNum(URL, context, 2);
          }
          if(_logValidation(URL) && _logValidation(output)){
          URL.forEach((x) => {
            context.response.write(
              `<html><head><script>window.open("${x}")</script></head></html>`
            );
          });
          context.response.write(
            `<html><head><script>window.location.href = '${output}'</script></head></html>`
          );
          }
          else{
            context.response.write(
              `<html><head><script>window.location.href = '${output}'</script></head></html>`
            );
          }
        } else if (
          parameters.custpage_radiofield == "1" &&
          _logValidation(parameters.custpage_array_of_tabs)
        ) {
          var postDataCon = getSublistDataPDF(parameters, context, true);
          var postDataSin = getSublistDataPDF(parameters, context, false);
          postDataSin.markedDataSinglePDFArr.push(
            postDataCon.markedDataConsolidateArr
          );
          var URL = printBOLSinglePdf(postDataSin);
          if(_logValidation(URL) && _logValidation(context)){
          URL = renderConsolidatedPDFNum(URL, context, 1);
          }
          if(_logValidation(URL) && _logValidation(output)){
          context.response.write(
            `<html><head><script>window.open("${URL}")</script></head></html>`
          );
          context.response.write(
            `<html><head><script>window.location.href = '${output}'</script></head></html>`
          );
          }
          else{
            context.response.write(
              `<html><head><script>window.location.href = '${output}'</script></head></html>`
            );
          }
        } else {
          if(_logValidation(context)){
      
          context.response.writePage({
            pageObject: mainForm(context),
          });
        }
        }
      }
    } catch (e) {
      log.debug("error in onRequest", e.toString());
    }
  }

  function makeSuiteLetUrl(parameters) {
    var suiteletURL = url.resolveScript({
      scriptId: "customscript_gbs_consolidated_bol",
      deploymentId: "customdeploy_gbs_consolidated_bol",
      params: {
        custpage_startdate: parameters.custpage_startdate,
        custpage_enddate: parameters.custpage_enddate,
        custpage_customer: parameters.custpage_customer,
        custpage_total_cubage: parameters.custpage_cubage,
        custpage_total_weight: parameters.custpage_total_weight,
        //  custpage_carrier_ship: parameters.custpage_carrier_ship,
        custpage_ship_to_select: parameters.custpage_ship_to_select,
      },
    });

    let output = url.resolveDomain({
      hostType: url.HostType.APPLICATION,
    });

    output = "https://" + output + suiteletURL;

    return output;
  }

 
  function getSublistDataPDF(parameters, context, consolidated) {
    var totalWeight = 0;
    var totalCubage = 0;
    var masterData = {};
    var markedDataConsolidateArr = [];
    var markedDataSinglePDFArr = [];
   

    var arrayOfTabs = JSON.parse(parameters.custpage_array_of_tabs);

    for (var x = 0; x < arrayOfTabs.length; x++) {
      var sublist = arrayOfTabs[x];
      var singlePdfArray = [];
      var subLineCount = context.request.getLineCount({
        group: sublist,
      });
    
      for (var y = 0; y < subLineCount; y++) {
        var mark = context.request.getSublistValue({
          group: sublist,
          name: "custpage_subitem_mark",
          line: y,
        });
       markCheckArr.push(mark);
        if (mark == "T") {
          markedDataConsolidateArr.push({
            isConsolidated: true,
            custpage_subitem_mark: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_mark",
              line: y,
            }),
            custpage_subitem_itemid: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_itemid",
              line: y,
            }),
            custpage_subitem_item: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_item",
              line: y,
            }),
            custpage_subitem_description: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_description",
              line: y,
            }),
            custpage_subitem_quantity: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_quantity",
              line: y,
            }),
            custpage_subitem_weight: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_weight",
              line: y,
            }),
            custpage_subitem_cubage: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_cubage",
              line: y,
            }),
            custpage_subitem_totalcubage: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_totalcubage",
              line: y,
            }),
            custpage_subitem_commodityinfo: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_commodityinfo",
              line: y,
            }),
          
            custpage_subitem_freightclass: context.request.getSublistValue({    
              group: sublist,
              name: "custpage_subitem_freightclass",
              line: y,
            }),
            custpage_subitem_nmfc: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_nmfc",
              line: y,
            }),
            custpage_subitem_pallet: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_pallet",
              line: y,
            }),
            custpage_subitem_unitabbreviation: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_unitabbreviation",
              line: y,
            }),
            custpage_subitem_hazmatgood: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_hazmatgood",
              line: y,
            }),
          

          });

          singlePdfArray.push({
            custpage_subitem_mark: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_mark",
              line: y,
            }),
            custpage_subitem_itemid: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_itemid",
              line: y,
            }),
            custpage_subitem_item: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_item",
              line: y,
            }),
            custpage_subitem_description: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_description",
              line: y,
            }),
            custpage_subitem_quantity: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_quantity",
              line: y,
            }),
            custpage_subitem_weight: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_weight",
              line: y,
            }),
            custpage_subitem_cubage: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_cubage",
              line: y,
            }),
            custpage_subitem_totalcubage: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_totalcubage",
              line: y,
            }),
            custpage_subitem_commodityinfo: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_commodityinfo",
              line: y,
            }),
            custpage_subitem_freightclass: context.request.getSublistValue({    
              group: sublist,
              name: "custpage_subitem_freightclass",
              line: y,
            }),
            custpage_subitem_nmfc: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_nmfc",
              line: y,
            }),
            custpage_subitem_pallet: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_pallet",
              line: y,
            }),
            custpage_subitem_unitabbreviation: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_unitabbreviation",
              line: y,
            }),
            custpage_subitem_hazmatgood: context.request.getSublistValue({
              group: sublist,
              name: "custpage_subitem_hazmatgood",
              line: y,
            }),
        
          });
          
          var weight = context.request.getSublistValue({
            group: sublist,
            name: "custpage_subitem_weight",
            line: y,
          });
          var cubage = context.request.getSublistValue({
            group: sublist,
            name: "custpage_subitem_totalcubage",
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
      if (singlePdfArray.length != 0) {
        markedDataSinglePDFArr.push(singlePdfArray);
      }
    }

    if (consolidated == true) {
      masterData = {
        markedDataConsolidateArr: markedDataConsolidateArr,
        totalWeight: totalWeight.toFixed(2),
        totalCubage: totalCubage.toFixed(2),
      };
    } else {
      masterData = {
        markedDataSinglePDFArr: markedDataSinglePDFArr,
        totalWeight: totalWeight.toFixed(2),
        totalCubage: totalCubage.toFixed(2),
      };
    }


    // log.debug('shipFromName in pdf',parameters.custpage_shipfrom_name);
    masterData.customer = parameters.custpage_customer;
    masterData.carrier = parameters.custpage_carrier_ship;
    masterData.shipFromName = parameters.custpage_shipfrom_name;
    masterData.frieghtChargeTerms = parameters.custpage_fright_charge_terms;
    masterData.shipTofobVal = parameters.custpage_shiptofob;
    masterData.shipFromfobVal = parameters.custpage_shipfrom_fob;
    masterData.location = parameters.custpage_location;
    masterData.proNumber = parameters.custpage_pro_number;
    masterData.scacValue = parameters.custpage_scac;
    masterData.shipToName = parameters.custpage_shiptoname;
    masterData.shipToAddress = parameters.custpage_shiptoaddress;
    masterData.shipToCity = parameters.custpage_shiptocity;
    masterData.shipToState = parameters.custpage_shiptostate;
    masterData.shipToZip = parameters.custpage_shiptozip;
    masterData.shipToCid = parameters.custpage_shiptocid;
    // masterData.nmfcValue = parameters.custpage_nmfc;
    masterData.locationsps = parameters.custpage_location_sps;
    // masterData.palletValue = parameters.custpage_pallets || 0;
    masterData.trailerNumber = parameters.custpage_trailer_number;
    masterData.sealNumber = parameters.custpage_seal_number;
    masterData.specialInstructions = parameters.custpage_special_instructions;
    masterData.billToName = parameters.custpage_billtoname;
    masterData.billToAddress = parameters.custpage_billtoaddress;
    masterData.billToCity = parameters.custpage_billtocity;
    masterData.billToState = parameters.custpage_billtostate;
    masterData.billToZip = parameters.custpage_billtozip;
    masterData.markCheckArr = markCheckArr;

    // log.debug("masterData", masterData);
    return masterData;
  }
  function renderConsolidatedPDFNum(pdf, context, num) {
    try {
      var count = 0;
      var fileArray = [];
      for (let iterator of pdf) {
        count++;
        var renderer = render.create();
        renderer.setTemplateByScriptId("CUSTTMPL_GBS_CONSOLIDATED_BOL");
        renderer.addCustomDataSource({
          format: render.DataSource.OBJECT,
          alias: "JSON",
          data: iterator,
        });
        var bol = renderer.renderAsPdf();
        bol.folder = 78804;
        bol.name = "samplepdf" + count;
        bol.isOnline = true;
        // log.debug("bol", bol);
        let fileid = bol.save();
        fileArray.push(fileid);
      }
      // log.debug({
      //   title: "fileArray",
      //   details: fileArray
      // });
      fileArray.reverse();
      var output = url.resolveDomain({
        hostType: url.HostType.APPLICATION,
      });
      if (num == 1) {
        var pdfFinal = renderSet({ files: fileArray });
        pdfFinal.name = "sampleva" + "_" + ".pdf";
        pdfFinal.isOnline = true;
        pdfFinal.folder = 78804;
        let fileId = pdfFinal.save();
        pdfFinal = file.load(fileId);
        output = "https://" + output + pdfFinal.url;
        //log.debug({title: "output",details: output });
        return output;
      } else if (num == 2) {
        let urlArray = [];
        fileArray.forEach(function (fileId) {
          let output = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
          });
          pdfSingle = file.load(fileId);
          output = "https://" + output + pdfSingle.url;
          urlArray.push(output);
        });
        return urlArray;
      }
    } catch (e) {
      log.debug("error in renderConsolidatedPDFNum", e.toString());
    }
  }

  function renderSet(opts) {
    var tpl = ['<?xml version="1.0"?>', "<pdfset>"];
    opts.files.forEach(function (id, idx) {
      const partFile = file.load({ id: id });
      var pdf_fileURL = xml.escape({ xmlText: partFile.url });
      tpl.push("<pdf src='" + pdf_fileURL + "'/>");
    });
    tpl.push("</pdfset>");
    return render.xmlToPdf({
      xmlString: tpl.join("\n"),
    });
  }

  function getParameters(context) {
    var request = context.request;
    //log.debug("request", request);
    var parameters = context.request.parameters;
    // log.debug("parameters", parameters);
    return {
      request,
      parameters,

    };
  }

  function mainForm(context) {
    try {
      var parameters = context.request.parameters;
      // log.debug({ title: "parameters", details: parameters });
      var sublistData = getSublistData(context);
      //log.debug({ title: "sublistData", details: sublistData });
      
      var defaultValues = {
        custpage_startdate: parameters.custpage_startdate,
        custpage_enddate: parameters.custpage_enddate,
        custpage_customer: parameters.custpage_customer,
        custpage_total_cubage: parameters.custpage_cubage,
        // custpage_total_weight: parameters.custpage_total_weight,
        custpage_carrier_ship: parameters.custpage_carrier_ship,
        custpage_shipfrom_name: parameters.custpage_shipfrom_name,
        custpage_transaction_type: parameters.custpage_transaction_type,
        custpage_ship_to_select: parameters.custpage_ship_to_select,
      };

      // log.debug('checkarr', defaultValues);

      var form = serverWidget.createForm({
        title: "Consolidated BOL",
      });
      form.clientScriptModulePath =
        "SuiteScripts/GBS/_gbs_cs_consolidated_bol.js";


      var {
        arrayoftabs,
        shipFrom,
        shipFromName,
        location,
        proNumber,
        scac,
        shipToName,
        shipToAddress,
        shipToCity,
        shipToState,
        shipToZip,
        shipToCID,
        // nmfc,
        // pallets,
        locationSPS,
        shipTofob,
        shipFromfob,
        carrier,
        frieghtChargeTerms,
        // cubageCalculation,
        shipToSelect,
        billToSelect,
        billToName,
        billToAddress,
        billToCity,
        billToState,
        billToZip,
        sealNumber,
        trailerNumber,
        specialInstructions,
        transType,
        shipToSelectHidden,
        billToSelectHidden,
        markCheckItem
      } = addBodyFields(form);

      form.addSubmitButton({
        label: "Submit",
      });
  
      form.addButton({
        id: "custpage_refresh",
        label: "Refresh",
        functionName: "refreshPage()"
      });
  
      form.updateDefaultValues(defaultValues);

      if (context.request.method != "GET") {
        form.addFieldGroup({
          id: "custpage_fg_2",
          label: "Item Fulfillments",
        });

        var formatted = formatJSON(
          resultsToJSON(
            getTransactions(
              "transaction",
              parameters.custpage_customer,
              parameters.custpage_startdate,
              parameters.custpage_enddate,
              parameters.custpage_transaction_type
            )
          )
        );
        if (formatted) {
          arrayoftabs.defaultValue = JSON.stringify(
            addTabbedSublist(form, formatted)
          );
        }

        shipFromLocation(parameters, shipFrom, location);

      }



      billToAddressSelect(
        parameters,
        billToSelect,
        billToName,
        billToAddress,
        billToCity,
        billToState,
        billToZip,
        billToSelectHidden
      );

      shipToLocation(
        parameters,
        shipToName,
        shipToAddress,
        shipToCity,
        shipToState,
        shipToZip,
        shipToCID,
        frieghtChargeTerms,
        shipToSelect,
        shipToSelectHidden
      );

      addSpsFields(
        parameters,
        proNumber,
        scac,
        // nmfc,
        // pallets,
        locationSPS,
        shipTofob,
        shipFromfob,
        carrier,
        sealNumber,
        trailerNumber,
        specialInstructions,  
        shipFromName
      );

   
      return form;
    } catch (e) {
      log.debug("error in mainForm", e.toString());
    }
  }


  function addBodyFields(form) {

    form.addFieldGroup({
      id: "custpage_fg_1",
      label: "Filters",
    });
    form.addField({
      id: "custpage_radiofield",
      type: serverWidget.FieldType.RADIO,
      label: "Print Master and Individual",
      source: "1",
      container: "custpage_fg_1",
    });
    form.addField({
      id: "custpage_radiofield",
      type: serverWidget.FieldType.RADIO,
      label: "Print Standalone PDF(s)",
      source: "2",
      container: "custpage_fg_1",
    });
    form.addField({
      id: "custpage_radiofield",
      type: serverWidget.FieldType.RADIO,
      label: "Print Consolidated PDF",
      source: "3",
      container: "custpage_fg_1",
    });

    form.addField({
      id: "custpage_startdate",
      type: serverWidget.FieldType.DATE,
      label: "Start Date",
      container: "custpage_fg_1",
    });
    form.addField({
      id: "custpage_enddate",
      type: serverWidget.FieldType.DATE,
      label: "End Date",
      container: "custpage_fg_1",
    });
    var customer = form.addField({
      id: "custpage_customer",
      type: serverWidget.FieldType.SELECT,
      label: "Customer",
      source: "customer",
      container: "custpage_fg_1",
    });
    customer.isMandatory = true;

    var transType = form.addField({
      id: "custpage_transaction_type",
      type: serverWidget.FieldType.SELECT,
      label: "Transaction Type",
      container: "custpage_fg_1",
    });

    transType.isMandatory = true;

    transType.addSelectOption({
      value: "",
      text: "",
    });

    transType.addSelectOption({
      value: "salesorder",
      text: "Sales Order",
    });

    transType.addSelectOption({
      value: "itemfulfillment",
      text: "Item Fulfillment",
    });

    var totalCubage = form.addField({
      id: "custpage_total_cubage",
      type: serverWidget.FieldType.TEXT,
      label: "Total Cubage",
      container: "custpage_fg_1",
    });
    totalCubage.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.INLINE,
    });
    var totalWeight = form.addField({
      id: "custpage_total_weight",
      type: serverWidget.FieldType.TEXT,
      label: "Total Weight",
      container: "custpage_fg_1",
    });
    totalWeight.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.INLINE,
    });
    var arrayoftabs = form.addField({
      id: "custpage_array_of_tabs",
      type: serverWidget.FieldType.LONGTEXT,
      label: "tabs array",
      container: "custpage_fg_1",
    });
    arrayoftabs.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.HIDDEN,
    });
    var location = form.addField({
      id: "custpage_location",
      type: serverWidget.FieldType.SELECT,
      label: "Location",
      source: "location",
      container: "custpage_fg_1",
    });
    var shipFrom = form.addField({
      id: "custpage_shipfrom",
      type: serverWidget.FieldType.LONGTEXT,
      label: "Ship From",
      container: "custpage_fg_1",
    });

    var shipFromName = form.addField({
      id: "custpage_shipfrom_name",
      type: serverWidget.FieldType.SELECT,
      label: "Ship From Name",
      // source: "customlist_jil_ship_from_name",
      container: "custpage_fg_1",
    });

    shipFromName.addSelectOption({
      value: "",
      text: "",
    });

    var shipFromfob = form.addField({
      id: "custpage_shipfrom_fob",
      type: serverWidget.FieldType.CHECKBOX,
      label: "Ship From FOB",
      container: "custpage_fg_1",
    });

    // var cubageCalculation = form.addField({
    //   id: "custpage_cubage_calculation",
    //   type: serverWidget.FieldType.TEXT,
    //   label: "Cubage Calculation",
    //   container: "custpage_fg_1",
    // });

    form.addFieldGroup({
      id: "custpage_fg_2",
      label: "Ship To Address",
    });

    var shipToSelect = form.addField({
      id: "custpage_ship_to_select",
      type: serverWidget.FieldType.SELECT,
      label: "Ship To Select",
      container: "custpage_fg_2",
    }); //updated

    // shipToSelect.addSelectOption({
    //   value: "",
    //   text: "",
    // });

    var shipToSelectHidden = form.addField({
      id: "custpage_ship_to_select_hidden",
      type: serverWidget.FieldType.TEXT,
      label: "Ship To Select Hidden",
      container: "custpage_fg_2",
    });

    shipToSelectHidden.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.HIDDEN,
    });

    var shipToName = form.addField({
      id: "custpage_shiptoname",
      type: serverWidget.FieldType.TEXT,
      label: "Name",
      container: "custpage_fg_2",
    });

    var shipToAddress = form.addField({
      id: "custpage_shiptoaddress",
      type: serverWidget.FieldType.TEXT,
      label: "Address",
      container: "custpage_fg_2",
    });

    var shipToCity = form.addField({
      id: "custpage_shiptocity",
      type: serverWidget.FieldType.TEXT,
      label: "City",
      container: "custpage_fg_2",
    });

    var shipToState = form.addField({
      id: "custpage_shiptostate",
      type: serverWidget.FieldType.TEXT,
      label: "State",
      container: "custpage_fg_2",
    });

    var shipToZip = form.addField({
      id: "custpage_shiptozip",
      type: serverWidget.FieldType.TEXT,
      label: "Zip",
      container: "custpage_fg_2",
    });

    var shipToCID = form.addField({
      id: "custpage_shiptocid",
      type: serverWidget.FieldType.TEXT,
      label: "CID#",
      container: "custpage_fg_2",
    });

    var shipTofob = form.addField({
      id: "custpage_shiptofob",
      type: serverWidget.FieldType.CHECKBOX,
      label: "Ship To FOB",
      container: "custpage_fg_2",
    });

    var carrier = form.addField({
      id: "custpage_carrier_ship",
      type: serverWidget.FieldType.SELECT,
      label: "Shipping Method",
      container: "custpage_fg_2",
    }); //updated

    carrier.addSelectOption({
      value: "",
      text: "",
    });

    form.addFieldGroup({
      id: "custpage_fg_4",
      label: "Bill To Address",
    });

    var billToSelect = form.addField({
      id: "custpage_bill_to_select",
      type: serverWidget.FieldType.SELECT,
      label: "Bill To Select",
      container: "custpage_fg_4",
    }); //updated

    var billToSelectHidden = form.addField({
      id: "custpage_bill_to_select_hidden",
      type: serverWidget.FieldType.TEXT,
      label: "bill To Select Hidden",
      container: "custpage_fg_2",
    });

    billToSelectHidden.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.HIDDEN,
    });

    var billToName = form.addField({
      id: "custpage_billtoname",
      type: serverWidget.FieldType.TEXT,
      label: "Name",
      container: "custpage_fg_4",
    });

    var billToAddress = form.addField({
      id: "custpage_billtoaddress",
      type: serverWidget.FieldType.TEXT,
      label: "Address",
      container: "custpage_fg_4",
    });

    var billToCity = form.addField({
      id: "custpage_billtocity",
      type: serverWidget.FieldType.TEXT,
      label: "City",
      container: "custpage_fg_4",
    });

    var billToState = form.addField({
      id: "custpage_billtostate",
      type: serverWidget.FieldType.TEXT,
      label: "State",
      container: "custpage_fg_4",
    });

    var billToZip = form.addField({
      id: "custpage_billtozip",
      type: serverWidget.FieldType.TEXT,
      label: "Zip",
      container: "custpage_fg_4",
    });

    form.addFieldGroup({
      id: "custpage_fg_3",
      label: "SPS",
    });

    var proNumber = form.addField({
      id: "custpage_pro_number",
      type: serverWidget.FieldType.TEXT,
      label: "Pro Number",
      container: "custpage_fg_3",
    });

    var locationSPS = form.addField({
      id: "custpage_location_sps",
      type: serverWidget.FieldType.TEXT,
      label: "Location",
      container: "custpage_fg_2",
    });

    var scac = form.addField({
      id: "custpage_scac",
      type: serverWidget.FieldType.TEXT,
      label: "SCAC",
      container: "custpage_fg_3",
    });

    // var nmfc = form.addField({
    //   id: "custpage_nmfc",
    //   type: serverWidget.FieldType.TEXT,
    //   label: "NMFC",
    //   container: "custpage_fg_3",
    // });

    // var pallets = form.addField({
    //   id: "custpage_pallets",
    //   type: serverWidget.FieldType.TEXT,
    //   label: "# Pallets",
    //   container: "custpage_fg_3",
    // });

    var sealNumber = form.addField({
      id: "custpage_seal_number",
      type: serverWidget.FieldType.TEXT,
      label: "Seal Number",
      container: "custpage_fg_3",
    });

    var trailerNumber = form.addField({
      id: "custpage_trailer_number",
      type: serverWidget.FieldType.TEXT,
      label: "Trailer Number",
      container: "custpage_fg_3",
    });

    var frieghtChargeTerms = form.addField({
      id: "custpage_fright_charge_terms",
      type: serverWidget.FieldType.SELECT,
      label: "Freight Charge Terms",
      container: "custpage_fg_3",
    });

    frieghtChargeTerms.addSelectOption({
      value: "",
      text: "",
    });
    frieghtChargeTerms.addSelectOption({
      value: "Collect",
      text: "Collect",
    });
    frieghtChargeTerms.addSelectOption({
      value: "Prepaid selection",
      text: "Prepaid selection",
    });
    frieghtChargeTerms.addSelectOption({
      value: "3rd party selection",
      text: "3rd party selection",
    });

    var specialInstructions = form.addField({
      id: "custpage_special_instructions",
      type: serverWidget.FieldType.TEXTAREA,
      label: "Special Instructions",
      container: "custpage_fg_3",
    });

    var markCheckItem = form.addField({
      id: "custpage_mark_check_item",
      type: serverWidget.FieldType.TEXTAREA,
      label: "Mark Check Item",
      container: "custpage_fg_3",
    });

    markCheckItem.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.HIDDEN,
    });

    return {
      arrayoftabs,
      shipFrom,
      shipFromName,
      location,
      proNumber,
      scac,
      shipToName,
      shipToAddress,
      shipToCity,
      shipToState,
      shipToZip,
      shipToCID,
      // nmfc,
      // pallets,
      locationSPS,
      shipTofob,
      shipFromfob,
      carrier,
      frieghtChargeTerms,
      // cubageCalculation,
      shipToSelect,
      billToSelect,
      billToName,
      billToAddress,
      billToCity,
      billToState,
      billToZip,
      sealNumber,
      trailerNumber,
      specialInstructions,
      transType,
      shipToSelectHidden,
      billToSelectHidden,
      markCheckItem
    };
  }

  function billToAddressSelect(
    parameters,
    billToSelect,
    billToName,
    billToAddress,
    billToCity,
    billToState,
    billToZip,
    billToSelectHidden
  ) {
    let billToSelectValue = parameters.custpage_bill_to_select;
    let billToNameValue = parameters.custpage_billtoname;
    let billToAddressValue = parameters.custpage_billtoaddress;
    let billToCityValue = parameters.custpage_billtocity;
    let billToStateValue = parameters.custpage_billtostate;
    let billToZipValue = parameters.custpage_billtozip;
    let billToSelectHiddenValue = parameters.custpage_bill_to_select_hidden;

    if(billToSelectHiddenValue){
      billToSelectHidden.defaultValue = billToSelectHiddenValue;
    }

    if (billToSelectValue) {
      billToSelect.defaultValue = billToSelectValue;
    }
    if (billToNameValue) {
      billToName.defaultValue = billToNameValue;
    }
    if (billToAddressValue) {
      billToAddress.defaultValue = billToAddressValue;
    }
    if (billToCityValue) {
      billToCity.defaultValue = billToCityValue;
    }
    if (billToStateValue) {
      billToState.defaultValue = billToStateValue;
    }
    if (billToZipValue) {
      billToZip.defaultValue = billToZipValue;
    }

  
  }

  function addSpsFields(
    parameters,
    proNumber,
    scac,
    // nmfc,
    // pallets,
    locationSPS,
    shipTofob,
    shipFromfob,
    carrier,
    sealNumber,
    trailerNumber,
    specialInstructions,
    shipFromName
  ) {
    let proNumberValue = parameters.custpage_pro_number;
    let scacValue = parameters.custpage_scac;
    // let nmfcValue = parameters.custpage_nmfc;
    // let palletsValue = parameters.custpage_pallets;
    let locationSPSVal = parameters.custpage_location_sps;
    let shipTofobVal = parameters.custpage_shiptofob;
    let shipFromfobVal = parameters.custpage_shipfrom_fob;
    let sealNumberVal = parameters.custpage_seal_number;
    let trailerNumberVal = parameters.custpage_trailer_number;
    let specialInstructionsVal = parameters.custpage_special_instructions;


  
    if (sealNumberVal) {
      sealNumber.defaultValue = sealNumberVal;
    }
    if (trailerNumberVal) {
      trailerNumber.defaultValue = trailerNumberVal;
    }
    if (specialInstructionsVal) {
      specialInstructions.defaultValue = specialInstructionsVal;
    }
    if (proNumberValue) {
      proNumber.defaultValue = proNumberValue;
    }
    if (shipTofobVal) {
      shipTofob.defaultValue = shipTofobVal;
    }
    if (shipFromfobVal) {
      shipFromfob.defaultValue = shipFromfobVal;
    }
    if (locationSPS) {
      locationSPS.defaultValue = locationSPSVal;
    }
    if (scacValue) {
      scac.defaultValue = scacValue;
    }

    // if (nmfcValue) {
    //   nmfc.defaultValue = nmfcValue;
    // }

    // if (pallets) {
    //   pallets.defaultValue = palletsValue;
    // }

    var searchOnShipFromNameList = search.create({
      type: "customlist_jil_ship_from_name",
      filters:
      [
         ["isinactive","is","F"]
      ],
      columns:
      [
         search.createColumn({
            name: "name",
            sort: search.Sort.ASC,
            label: "Name"
         })
      ]
   });

   var searchOnShipFromNameListResults = searchOnShipFromNameList.run().getRange(0, 1000);

   for (let i = 0; i < searchOnShipFromNameListResults.length; i++) {
    shipFromName.addSelectOption({
      value: searchOnShipFromNameListResults[i].getValue({ name: "name" }),
      text: searchOnShipFromNameListResults[i].getValue({ name: "name" }),
    });
  }


    var shipitemSearchObj = search.create({
      type: "shipitem",
      filters: [["isinactive", "is", "F"]],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({
          name: "itemid",
          sort: search.Sort.ASC,
          label: "Name",
        }),
      ],
    });

    var shipitemSearchResults = shipitemSearchObj.run().getRange(0, 1000);

    for (let i = 0; i < shipitemSearchResults.length; i++) {
      carrier.addSelectOption({
        value: shipitemSearchResults[i].getValue({ name: "itemid" }),
        text: shipitemSearchResults[i].getValue({ name: "itemid" }),
      });
    }
  }

  function shipToLocation(
    parameters,
    shipToName,
    shipToAddress,
    shipToCity,
    shipToState,
    shipToZip,
    shipToCID,
    frieghtChargeTerms,
    shipToSelect,
    shipToSelectHidden
  ) {
    let shipToNameValue = parameters.custpage_shiptoname;
    let shipToAddressValue = parameters.custpage_shiptoaddress;
    let shipToCityValue = parameters.custpage_shiptocity;
    let shipToStateValue = parameters.custpage_shiptostate;
    let shipToZipValue = parameters.custpage_shiptozip;
    let shipToCIDValue = parameters.custpage_shiptocid;
    let shipToSelectValue = parameters.custpage_ship_to_select; //updated
    let frieghtVal = parameters.custpage_fright_charge_terms;
    let shipToSelectHiddenValue = parameters.custpage_ship_to_select_hidden; //updated

    // log.debug("shipToSelectValue", shipToSelectValue);

    if(shipToSelectHidden){
      shipToSelectHidden.defaultValue = shipToSelectHiddenValue;
    }

    if (shipToSelectValue) {
      shipToSelect.defaultValue = shipToSelectValue;
    }
    if (shipToNameValue) {
      shipToName.defaultValue = shipToNameValue;
    }
    if (frieghtVal) {
      frieghtChargeTerms.defaultValue = frieghtVal;
    }

    if (shipToAddressValue) {
      shipToAddress.defaultValue = shipToAddressValue;
    }

    if (shipToCityValue) {
      shipToCity.defaultValue = shipToCityValue;
    }

    if (shipToStateValue) {
      shipToState.defaultValue = shipToStateValue;
    }

    if (shipToZipValue) {
      shipToZip.defaultValue = shipToZipValue;
    }

    if (shipToCIDValue) {
      shipToCID.defaultValue = shipToCIDValue;
    }
  }

  function shipFromLocation(parameters, shipFrom, location,) {
    // let cusbageCalculationValue = parameters.custpage_cubage_calculation;

    // if (cusbageCalculationValue) {
    //   cubageCalculation.defaultValue = cusbageCalculationValue;
    // }

    let getLocation = parameters.custpage_location;

    if (_logValidation(getLocation)) {
      location.defaultValue = getLocation;

      let getShipFromLocation = record.load({
        type: "location",
        id: getLocation,
        // isDynamic: true
      });

      let getShipFromLocationText = getShipFromLocation.getText({
        fieldId: "mainaddress_text",
      });

      shipFrom.defaultValue = getShipFromLocationText;
    }
  }

  function shipAddressLocation(markedData, form) {
    try {
      if (_logValidation(markedData.location)) {
        var getShipFromLocation = record.load({
          type: "location",
          id: markedData.location,
          // isDynamic: true
        });

        var shipaddrSubRecord = getShipFromLocation.getSubrecord({
          fieldId: "mainaddress",
        });

        var addresseeNameOnSubRecord = shipaddrSubRecord.getValue({
          fieldId: "addressee",
        });

        var addreesOnSubRecord = shipaddrSubRecord.getValue({
          fieldId: "addr1",
        });

        var cityOnSubRecord = shipaddrSubRecord.getValue({ fieldId: "city" });

        var stateOnSubRecord = shipaddrSubRecord.getValue({ fieldId: "state" });

        var zipOnSubRecord = shipaddrSubRecord.getValue({ fieldId: "zip" });

        var phoneOnSubRecord = shipaddrSubRecord.getValue({
          fieldId: "addrphone",
        });
      }
      return {
        addresseeNameOnSubRecord,
        addreesOnSubRecord,
        cityOnSubRecord,
        stateOnSubRecord,
        zipOnSubRecord,
        phoneOnSubRecord,
      };
    } catch (e) {
      log.debug("error in shipAddressLocation", e.toString());
    }
  }

  function printBOLConsolidated(markedData) {
    try {
      // log.debug("markedData", markedData);
      var spsDataArr = [];
      let markedDataArr = markedData.markedDataConsolidateArr;
      // log.debug("markedDataArr", markedDataArr);
      if(_logValidation(markedDataArr)){
      var totalPkgCount = 0;
      let {
        addresseeNameOnSubRecord,
        addreesOnSubRecord,
        cityOnSubRecord,
        stateOnSubRecord,
        zipOnSubRecord,
        phoneOnSubRecord,
      } = shipAddressLocation(markedData);
      let conbolNumber = getBOLNum(
        "customrecord_gbs_consolidated_bol_num",
        true
      );
      // log.debug("conbolNumber", conbolNumber);
      var fields = {};
      fields["isConsolidatedpresent"] = true;
      fields["conBolNumber"] = conbolNumber;
     

      ({ shipToLocationNum, bolNumber, totalPkgCount,resultCommodity,commodityArr, totalPkgCount, totalWeightOrder } = processLineLevelData(
        markedDataArr,
        spsDataArr,
        conbolNumber,
        totalPkgCount,
        fields,
        markedData,
        true
      ));

      fields['commodity'] = resultCommodity;
      // log.debug("resultCommodity function", resultCommodity);

      var arrayOfURL = [];
      var json = pdfJsonObj(
        fields,
        addresseeNameOnSubRecord,
        addreesOnSubRecord,
        cityOnSubRecord,
        stateOnSubRecord,
        zipOnSubRecord,
        phoneOnSubRecord,
        markedData,
        markedDataArr,
        spsDataArr,
        shipToLocationNum,
        totalPkgCount,
        totalWeightOrder,
    
      );
      //log.debug({ title: "json", details: json });
      arrayOfURL.push(json);
      // log.debug({ title: "arrayOfURL consolidated", details: arrayOfURL });
      return arrayOfURL;
      }
    } catch (e) {
      log.debug("error in printBOLConsolidated", e.toString());
    }
  }

  function printBOLSinglePdf(markedData) {
    try {
      // log.debug("markedData", markedData);
      var arrayOfURL = [];
      var count = 0;
      let val = markedData.markedDataSinglePDFArr;
      if(_logValidation(val)){
      let {
        addresseeNameOnSubRecord,
        addreesOnSubRecord,
        cityOnSubRecord,
        stateOnSubRecord,
        zipOnSubRecord,
        phoneOnSubRecord,
      } = shipAddressLocation(markedData);
      
      // log.debug("val", val);
      for (var x of val) {
        // log.debug({ title: "x", details: x });
        let checkIfConsolidated = x[0].isConsolidated;
        // log.debug("checkIfConsolidated", checkIfConsolidated); 

        var spsDataArr = [];
        var fields = {};
        
        if (_logValidation(checkIfConsolidated)) {
          let conbolNumber = getBOLNum(
            "customrecord_gbs_consolidated_bol_num",
            true
          );

          fields["isConsolidatedpresent"] = true;
          fields["conBolNumber"] = conbolNumber;

          ({ shipToLocationNum, bolNumber, resultCommodity,commodityArr, totalPkgCount, totalWeightOrder } =
            processLineLevelData(
              x,
              spsDataArr,
              conbolNumber,
              fields,
              markedData,
              true
            ));
            fields['commodity'] = resultCommodity;
        } else {
          fields["isConsolidatedpresent"] = false;
          // var standaloneBOLNum = getBOLNum(
          //   "customrecord_gbs_standalone_bol_number",
          //   false
          // );
          standaloneBOLNum = "";
          fields["singleBolNumber"] = standaloneBOLNum;
          ({ shipToLocationNum, bolNumber, resultCommodity,commodityArr, totalPkgCount, totalWeightOrder } =
            processLineLevelData(
              x,
              spsDataArr,
              standaloneBOLNum,
              fields,
              markedData,
              false
            ));
            fields['commodity'] = commodityArr;
        }
        // fields['commodity'] = resultCommodity;
        var json = pdfJsonObj(
          fields,
          addresseeNameOnSubRecord,
          addreesOnSubRecord,
          cityOnSubRecord,
          stateOnSubRecord,
          zipOnSubRecord,
          phoneOnSubRecord,
          markedData,
          x,
          spsDataArr,
          shipToLocationNum,
          totalPkgCount,
          totalWeightOrder,
        );
        // log.debug({ title: "printBOL JSON", details: json });
        arrayOfURL.push(json);
        // log.debug({ title: "arrayOfURL", details: arrayOfURL });
      }
      // log.debug({ title: "arrayOfURL standalone", details: arrayOfURL });
      return arrayOfURL;
    }
    } catch (e) {
      log.debug("error in printBOLSinglePdf", e.toString());
    }
  }

  function processLineLevelData(
    x,
    spsDataArr,
    conbolNumber,
    fields,
    markedData,
    consolidated
  ) {
    //log.debug("Start processLineLevelData...");
    // log.debug("x", x);
    var totalPkgCount = 0;
    var totalWeightOrder= 0;

    ({resultCommodity,commodityArr} = carrierInfoCommodity(x));

    for (let f = 0; f < x.length; f++) {
      let itemFullId = x[f].custpage_subitem_itemid;
      // log.debug("itemFullId", itemFullId);

      let itemWeight = parseFloat(x[f].custpage_subitem_weight) || 0;
      // log.debug(`itemWeight ${itemFullId}`, itemWeight);
      itemWeight = parseFloat(itemWeight.toFixed(2)) ;

    
      let getPkgCount = parseFloat(x[f].custpage_subitem_quantity) || 0;
      // log.debug('getPkgCount', getPkgCount);

      var found = spsDataArr.findIndex(function (element) {
        return element.itemFullId == itemFullId;
      });
      // log.debug("found", found);


      if (found == -1) {
        if(transRecType == "itemfulfillment"){
        var getSpsValues = search.lookupFields({
          type: transRecType,
          id: itemFullId,
          columns: [
            "custbody_sps_z7_addresslocationnumber",
            "custbody_sps_masterbilloflading",
            "custbody_sps_ponum_from_salesorder",
            "custbody_jil_cust_po_num"
            // "custbody_sps_potype",
            // "custbody_sps_department",
          ],
        });

        var poNumber = getSpsValues.custbody_sps_ponum_from_salesorder;
        fields["poNumber"] = poNumber;
        // log.debug('poNumber', poNumber);
      }
      else{
        var getSpsValues = search.lookupFields({
          type: transRecType,
          id: itemFullId,
          columns: [
            "custbody_sps_z7_addresslocationnumber",
            "custbody_sps_masterbilloflading",
            "tranid",
            "custbody_jil_cust_po_num"
            // "custbody_sps_potype",
            // "custbody_sps_department",
          ],
        });

        var poNumber = getSpsValues.tranid;
        fields["poNumber"] = poNumber;
        // log.debug('poNumber', poNumber);
      }
        if(transRecType == "itemfulfillment"){
        var submitfieldobj = {
          type: transRecType,
          id: itemFullId,
          values: {
            custbody_sps_carrierpronumber: markedData.proNumber,
            custbody_sps_carrieralphacode: markedData.scacValue,
            custbody_bol_seal_number: markedData.sealNumber,
            custbody_bol_trailer_number: markedData.trailerNumber,
            custbody_bol_special_instructions: markedData.specialInstructions,
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        };
     
        if (consolidated === false) {
          submitfieldobj.values.custbody_sps_billofladingnumber = poNumber;
        } else {
          submitfieldobj.values.custbody_sps_masterbilloflading = conbolNumber;
        }
        record.submitFields(submitfieldobj);

      }

        // log.debug('getSpsValues', getSpsValues);
        var shipToLocationNum =
          getSpsValues.custbody_sps_z7_addresslocationnumber;

        var bolNumber = getSpsValues.custbody_sps_masterbilloflading;

        // let poType = getSpsValues.custbody_sps_potype;
        // log.debug("poType", poType);
        let poType = getSpsValues.custbody_jil_cust_po_num;
        // let department = getSpsValues.custbody_sps_department;
        // log.debug("department", department);

        totalPkgCount = parseFloat(totalPkgCount) + parseFloat(getPkgCount) || 0;
        // log.debug("totalPkgCount", totalPkgCount);

        totalWeightOrder = parseFloat(totalWeightOrder) + parseFloat(itemWeight) || 0;
        // log.debug("totalWeightOrder", totalWeightOrder);

        spsDataArr.push({
          poNumber: poNumber,
          poType: poType,
          // department: department,
          getPkgCount: getPkgCount || 0,
          // pallets: markedData.palletValue || 0,
          itemFullId: itemFullId,
          itemWeight: itemWeight || 0,
        });

        // log.debug("spsDataArr", spsDataArr);
      } else {
        let obj = spsDataArr[found];
        obj.itemWeight = parseFloat(obj.itemWeight) + parseFloat(itemWeight);
        x[found].custpage_subitem_weight = obj.itemWeight;

        let objPkg = spsDataArr[found];
        objPkg.getPkgCount = parseFloat(objPkg.getPkgCount) + parseFloat(getPkgCount);
        x[found].custpage_subitem_quantity = objPkg.getPkgCount || 0;

        
        totalPkgCount = parseFloat(totalPkgCount) + parseFloat(getPkgCount) || 0;
        // log.debug("totalPkgCount in else", totalPkgCount);

        totalWeightOrder = parseFloat(totalWeightOrder) + parseFloat(itemWeight) || 0;
        // log.debug("totalWeightOrder in else", totalWeightOrder);

      }
    }
   
    //log.debug("End processLineLevelData...");
    return { shipToLocationNum, bolNumber, resultCommodity,commodityArr, totalPkgCount, totalWeightOrder };
  }

  function carrierInfoCommodity(x){

    var commodityArr = [];

    for (let i = 0; i < x.length; i++) {
     
      let nmfcComm = x[i].custpage_subitem_nmfc || 0;
      // log.debug("nmfcComm", nmfcComm);
      let commodityInfo = x[i].custpage_subitem_commodityinfo || "";

      let freightClassComm = x[i].custpage_subitem_freightclass || 0;

      let palletComm = x[i].custpage_subitem_pallet || 0;

      let casesComm = x[i].custpage_subitem_quantity || 0;

      let itemWeightComm = x[i].custpage_subitem_weight || 0;

      let itemUnit = x[i].custpage_subitem_unitabbreviation || "";

      let itemHazmatGood = x[i].custpage_subitem_hazmatgood || "";


      let commodityObj = {
        nmfcComm: parseFloat(nmfcComm) || 0,
        commodityInfo: commodityInfo || "",
        freightClassComm: parseFloat(freightClassComm)  || 0,
        palletComm: parseFloat(palletComm) || 0,
        casesComm: parseFloat(casesComm) || 0,
        itemWeightComm: parseFloat(itemWeightComm) || 0,
        itemUnit: itemUnit || "",
        itemHazmatGood: itemHazmatGood || "",
      };
      commodityArr.push(commodityObj);
  }
    // log.debug('commodityArr', commodityArr);
    var resultCommodity = [];
  commodityArr.reduce(function(res, value) {
  if (!res[value.commodityInfo]) {
    res[value.commodityInfo] = { commodityInfo: value.commodityInfo, nmfcComm: value.nmfcComm, freightClassComm: value.freightClassComm, palletComm: 0, casesComm: 0, itemWeightComm: 0, itemUnit: value.itemUnit, itemHazmatGood: value.itemHazmatGood };
    resultCommodity.push(res[value.commodityInfo])
  }
  res[value.commodityInfo].palletComm += value.palletComm || 0;
  res[value.commodityInfo].casesComm += value.casesComm || 0;
  res[value.commodityInfo].itemWeightComm += value.itemWeightComm || 0;
  return res;
}, {});

  // log.debug('resultCommodity', resultCommodity);

  return {resultCommodity, commodityArr};
   
  }


  function pdfJsonObj(
    fields,
    addresseeNameOnSubRecord,
    addreesOnSubRecord,
    cityOnSubRecord,
    stateOnSubRecord,
    zipOnSubRecord,
    phoneOnSubRecord,
    markedData,
    x,
    spsDataArr,
    shipToLocationNum,
    totalPkgCount,
    totalWeightOrder,
  ) {
    // log.debug('markddata',markedData)
    fields["tranid"] = 10001;
    fields["shipmethod"] = markedData.carrier;
    fields["frieghtChargeTerms"] = markedData.frieghtChargeTerms;
    fields["shipattentionname"] = markedData.shipFromName;
    fields["shipattention"] = addresseeNameOnSubRecord;
    fields["shipTofobVal"] = markedData.shipTofobVal;
    fields["shipFromfobVal"] = markedData.shipFromfobVal;
    fields["locationsps"] = markedData.locationsps;
    fields["shipaddr1"] = addreesOnSubRecord;
    fields["shipcity"] = cityOnSubRecord;
    fields["shipstate"] = stateOnSubRecord;
    fields["shipzip"] = zipOnSubRecord;
    fields["shipphone"] = phoneOnSubRecord;
    fields["pro_number"] = markedData.proNumber;
    fields["scac"] = markedData.scacValue;
    fields["shipToName"] = markedData.shipToName;
    fields["shipToAddress"] = markedData.shipToAddress;
    fields["shipToCity"] = markedData.shipToCity;
    fields["shipToState"] = markedData.shipToState;
    fields["shipToZip"] = markedData.shipToZip;
    fields["shipToCid"] = markedData.shipToCid;
    //fields["bolNumber"] = bolNumber;
    fields["shipToLocationNum"] = shipToLocationNum;
    // fields["nmfc"] = markedData.nmfcValue;
    fields["pallet"] = markedData.palletValue;
    fields["customer"] = markedData.customer;
    fields["custbody_total_item_weight"] = markedData.totalWeight;
    fields["cubage"] = markedData.totalCubage;
    fields["trailer_number"] = markedData.trailerNumber;
    fields["seal_number"] = markedData.sealNumber;
    fields["special_instructions"] = markedData.specialInstructions;
    fields["billToName"] = markedData.billToName;
    fields["billToAddress"] = markedData.billToAddress;
    fields["billToCity"] = markedData.billToCity;
    fields["billToState"] = markedData.billToState;
    fields["billToZip"] = markedData.billToZip;
    fields["items"] = x[0];
    fields["spsData"] = spsDataArr;
    fields["totalPkgCount"] = totalPkgCount;
    fields["totalWeightOrder"] = totalWeightOrder;
 
    // fields['commodity'] = commodityArr;
    var json = { record: fields };
    // log.debug("json", json);
    return json;
  }

 
  function getSublistData(context, sublistList) {
    //log.debug({title: 'getSublistData Started...'});
    if (!sublistList) {
      return;
    }
    var output = [];
    var parameters = context.request.parameters;
    var sublistCount = sublistList.length;
    for (var n = 0; n < sublistCount; n++) {
      var sublistLabel = sublistList[n];
      var fieldsLabel = sublistLabel + "fields";
      var dataLabel = sublistLabel + "data";
      var sublistFields = parameters[fieldsLabel];
      //log.debug({title: 'sublistFields', details: sublistFields});
      var sublistData = parameters[dataLabel];
      //log.debug({title: 'sublistData', details: sublistData});
      if (!sublistFields) {
        return;
      }
      var fields = sublistFields.split("\u0001");
      //log.debug({title: 'fields', details: JSON.stringify(fields)});
      var fieldcount = fields.length;
      //log.debug({title: 'fieldcount', details: fieldcount});
      for (var i = 0; i < fieldcount; i++) {
        var field = fields[i];
        if (!field) {
          fields[i] = fields[i - 1] + "id";
        }
      }
      //        	log.debug({title: 'after fields update', details: JSON.stringify(fields)});
      var rows = sublistData.split("\u0002");
      //        	log.debug({title: 'rows', details: JSON.stringify(rows)});
      var rowcount = rows.length;
      //        	log.debug({title: 'rowcount', details: rowcount});
      var x;
      var y;

      for (x = 0; x < rowcount; x++) {
        var row = rows[x];
        var rowdata = row.split("\u0001");
        //        		log.debug({title: 'rowdata', details: JSON.stringify(rowdata)});
        var rowobj = {};
        for (y = 0; y < fieldcount; y++) {
          rowobj[fields[y]] = rowdata[y];
        }
        output.push(rowobj);
      }
    }
    // log.debug('output', output);
    return output;
  }
  function getBOLNum(customrecord, isMaster) {
    if (isMaster == true) {
      let todayDate = new Date();
      var todayDateStr =
        todayDate.getMonth() +
        1 +
        "" +
        todayDate.getDate() +
        "" +
        todayDate.getFullYear();

      todayDateStr = parseInt(todayDateStr);
    }

    let conBolNum = record.create({
      type: customrecord,
    });

    let conBolNumId = conBolNum.save();

    let currNum = search.lookupFields({
      type: customrecord,
      id: conBolNumId,
      columns: "name",
    });

    // log.debug("currNum", currNum);

    //todo: delete it to avoid garbage in the system
    record.delete({
      type: customrecord,
      id: conBolNumId,
    });

    if (isMaster == true) {
      var bolNumber = todayDateStr + currNum.name;
    } else {
      bolNumber = currNum.name;
    }

    // log.debug("bolNumber", bolNumber);
    return bolNumber;
  }

  function getTransactions(recType, customer, startDate, endDate, transType) {
    var filters = [];

    if (transType == "itemfulfillment") {
      filters.push(
        search.createFilter({
          name: "type",
          operator: "ANYOF",
          values: "ItemShip",
        })
      );

      filters.push(
        search.createFilter({
          name: "status",
          operator: "ANYOF",
          values: ["ItemShip:A", "ItemShip:B"], //picked and packed
        })
      );

      filters.push(
        search.createFilter({ name: "shipping", operator: "IS", values: "F" })
      );

      filters.push(
        search.createFilter({
          name: "formulanumeric",
          formula: "MOD({linesequencenumber},3)",
          operator: "EQUALTO",
          values: 0,
        })
      );
    }

    if (transType == "salesorder") {
      filters.push(
        search.createFilter({
          name: "type",
          operator: "ANYOF",
          values: "SalesOrd",
        })
      );

      filters.push(
        search.createFilter({
          name: "status",
          operator: "ANYOF",
          values: ["SalesOrd:B","SalesOrd:D"], //pending fulfillment ane partially fulfilled
        })
      );

      filters.push(
        search.createFilter({
          name: "formulanumeric",
          formula: "{quantity}-nvl({quantityshiprecv},0)",
          operator: "greaterthan",
          values: 0,
        })
      );

      filters.push(
        search.createFilter({ name: "mainline", operator: "IS", values: "F" })
      );
      filters.push(
        search.createFilter({ name: "taxline", operator: "IS", values: "F" })
      );
      // filters.push(search.createFilter({name: 'shipline', operator: 'IS', values: 'F'}));
      filters.push(
        search.createFilter({ name: "shipping", operator: "IS", values: "F" })
      );
      // filters.push(search.createFilter({name: 'cogs', operator: 'IS', values: 'F'}))
    }

    filters.push(
      search.createFilter({ name: "name", operator: "ANYOF", values: customer })
    );
    filters.push(
      search.createFilter({
        name: "trandate",
        operator: "ONORAFTER",
        values: startDate,
      })
    );
    filters.push(
      search.createFilter({
        name: "trandate",
        operator: "ONORBEFORE",
        values: endDate,
      })
    );
    //filters.push(search.createFilter({name: 'mainline', operator: 'IS', values: 'F'}));
    //filters.push(search.createFilter({name: 'taxline', operator: 'IS', values: 'F'}));
    // filters.push(search.createFilter({name: 'shipline', operator: 'IS', values: 'F'}));
    // filters.push(
    //   search.createFilter({ name: "shipping", operator: "IS", values: "F" })
    // );
    //filters.push(search.createFilter({name: 'cogs', operator: 'IS', values: 'F'}));

    var columns = [];
    columns.push(
      search.createColumn({ name: "internalid", label: "internalid" })
    );
    columns.push(
      search.createColumn({ name: "tranid", label: "documentnumber" })
    );
    columns.push(search.createColumn({ name: "item", label: "item" }));

    columns.push(search.createColumn({ name: "custcol_gbs_if_so_pallet", label: "Pallet" }));

    columns.push(search.createColumn({name: "unitabbreviation", label: "Units"}));

   columns.push(search.createColumn({
      name: "formulatext",
      formula: "{item.custitem_hazmat_good_hide}",
      label: "Formula (Text)"
   }));

    columns.push(
      search.createColumn({
        name: "salesdescription",
        join: "item",
        label: "description",
      })
    );
    columns.push(search.createColumn({ name: "quantity", label: "quantity" }));
    columns.push(
      search.createColumn({
        name: "formulanumeric",
        formula: "{item.weight} * {quantity}",
        label: "weight",
      })
    );
    // columns.push(
    //   search.createColumn({
    //     name: "custcol_if_bol_col_weight",
    //     label: "weight",
    //   })
    // );
    columns.push(
      search.createColumn({
        name: "custitem_jil_nmfc",
        join: "item",
        label: "nmfc",
      })
    ); //updated

    columns.push(
      search.createColumn({
        name: "custitem_jil_freight_class",
        join: "item",
        label: "freightclass",
      })
    ); //updated

    columns.push(
      search.createColumn({
        name: "custitem_jil_commodity_info",
        join: "item",
        label: "commodityinfo",
      })
    ); //updated

    columns.push(
      search.createColumn({
        name: "formulanumeric_1",
        formula:
          "{item.custitem_jil_length} *  {item.custitem_jil_height} * {item.custitem_jil_width}", //updated
        label: "cubage",
      })
    );
    columns.push(
      search.createColumn({
        name: "formulanumeric_2",
        formula:
          "{item.custitem_jil_length} *  {item.custitem_jil_height} * {item.custitem_jil_width} * {quantity}", //updated
        label: "totalcubage",
      })
    );

    var results = search
      .create({
        type: recType,
        filters: filters,
        columns: columns,
      })
      .run()
      .getRange({ start: 0, end: 1000 });

    if (!results || results.length == 0) {
      return false;
    }
    // log.debug("results", results);
    return results;
  }
  function resultsToJSON(results) {
    if (results) {
      var records = [];
      var resultlen = results.length;

      for (x = 0; x < resultlen; x++) {
        var result = results[x];
        var col = result.columns;
        var record = {};
        if (result.id) {
          record["id"] = result.id;
        }

        for (n in col) {
          var label = col[n].label;
          var name = col[n].name;
          var join = col[n].join;
          var summary = col[n].summary;
          var value = result.getText({
            name: name,
            join: join,
            summary: summary,
          })
            ? result.getText({ name: name, join: join, summary: summary })
            : result.getValue({ name: name, join: join, summary: summary });
          record[label] = value.replace("\r\n", "");
        }
        records.push(record);
      }
// log.debug("records result to json", records);
      return records;
    } else {
      return false;
    }
  }
  function formatJSON(json) {
    if (json) {
      // log.debug("json", json);
      var jsonLen = json.length;
      //log.debug({ title: "Length", details: jsonLen });
      var records = [];
      var previous;
      for (x = 0; x < jsonLen; x++) {
        var row = json[x];
        var internalId = row.internalid;
        var documentNumber = row.documentnumber;
        var recordObj = {};
        if (x == 0 || internalId != previous) {
          recordObj["internalid"] = internalId;
          recordObj["documentnumber"] = documentNumber;
          records.push(recordObj);
          previous = internalId;
        }
      }
      //log.debug({ title: "Records", details: records });

      var recordsLen = records.length;
      for (var a = 0; a < recordsLen; a++) {
        var recordsRow = records[a];
        var recordId = recordsRow.internalid;
        var items = [];
        for (var b = 0; b < jsonLen; b++) {
          var jsonRow = json[b];
          var jsonId = jsonRow.internalid;
          var itemObj = {};
          if (jsonId == recordId) {
            itemObj["itemid"] = jsonRow.internalid;
            itemObj["item"] = jsonRow.item;
            itemObj["description"] = jsonRow.description;
            itemObj["quantity"] = jsonRow.quantity;
            itemObj["weight"] = jsonRow.weight;
            itemObj["nmfc"] = jsonRow.nmfc; //updated
            itemObj["freightclass"] = jsonRow.freightclass; //updated
            itemObj["commodityinfo"] = jsonRow.commodityinfo; //updated
            itemObj["cubage"] = jsonRow.cubage;
            itemObj["totalcubage"] = jsonRow.totalcubage;
            itemObj["pallet"] = jsonRow.Pallet;
            itemObj["unitabbreviation"] = jsonRow.Units;
            itemObj["hazmatgood"] = jsonRow['Formula (Text)'];
            items.push(itemObj);
          }
        }
        recordsRow["items"] = items;
      }
      // log.debug('itemobj',itemObj)
      // log.debug({ title: "Records", details: records });
      return records;
    } else {
      return false;
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
  function addTabbedSublist(form, json) {
    //log.debug({ title: "addTabbedSublist Started..." });
    var arrayOfTabs = [];
    var jsonLen = json.length;
    //log.debug({ title: "jsonLen", details: jsonLen });
    for (var x = 0; x < jsonLen; x++) {
      var jsonRec = json[x];
      var tabId = "custpage_tab_" + x;
      // log.debug({title: 'tabId', details: tabId});
      var tabLabel = jsonRec.documentnumber;
      //log.debug({title: 'tabLabel', details: tabLabel});
      var tabItems = jsonRec.items;
      //log.debug({ title: "tabItems", details: tabItems });
      var sublistId = "custpage_sub_" + x;
      // log.debug({ title: "sublistId", details: sublistId });
      arrayOfTabs.push(sublistId);

      form.addTab({
        id: tabId,
        label: tabLabel,
      });

      addSublistFromJSON(form, sublistId, tabItems, "Items", tabId);
    }
    // log.debug({ title: "arrayOfTabs", details: arrayOfTabs });
    return arrayOfTabs;
  }
  function addSublistFromJSON(form, sublistId, json, sublistLabel, tab) {
    //log.debug({ title: "addSublistFromJSON Started..." });
    if (!json || json.length == 0) {
      //log.debug({ title: "No items for sublist" });
      return;
    }
    // Create Sublist
    var sublist = form.addSublist({
      id: sublistId,
      type: serverWidget.SublistType.LIST,
      label: sublistLabel,
      tab: tab,
    });
        
    sublist.addMarkAllButtons();
    sublist.addField({
      id: "custpage_subitem_mark",
      label: "mark",
      type: serverWidget.FieldType.CHECKBOX,
    });
 
    var resCount = json.length;
    //log.debug({title: 'resCount', details: resCount});
    //log.debug({title: 'Add Line Items to Sublist'});
    for (var j = 0; j < resCount; j++) {
      var result = json[j];
      for (n in result) {
        var id = "custpage_subitem_" + n;
        // log.debug({title: 'id', details: id});
        var label = n;
        //log.debug({title: 'label', details: label});
        var value = result[n];
        //log.debug({title: 'value', details: value});

        // Add Fields first and only once
        if (j == 0) {
          sublist.addField({
            id: id,
            label: label,
            type: serverWidget.FieldType.TEXT,
          });
        }
   
        // If the value is blank, set it to null to avoid errors
        if (!value) {
          value = null;
        }
        // Set the Values of the Fields
        sublist.setSublistValue({
          id: id,
          line: j,
          value: value,
        });
      }
    }

    let hidePallet = sublist.getField({
      id: "custpage_subitem_pallet",
      line: 0,
    });
    hidePallet.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.HIDDEN,
    });

    let unitabbreviation = sublist.getField({
      id: "custpage_subitem_unitabbreviation",
      line: 0,
    });
    unitabbreviation.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.HIDDEN,
    });

    let hazmatgood = sublist.getField({
      id: "custpage_subitem_hazmatgood",
      line: 0,
    });
    hazmatgood.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.HIDDEN,
    });

  }

  return {
    onRequest: onRequest,
  };
});
