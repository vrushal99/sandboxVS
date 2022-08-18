/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    function (record, runtime, search) {

        function afterSubmit(context){

            var loadItemRecord = context.newRecord;
            var loadItemId = loadItemRecord.id;
            // log.debug('loadItemId', loadItemId);
            var loadItemType = loadItemRecord.type;
            // log.debug('loadItemType', loadItemType);

            let loadItem = record.load({
                type: loadItemType,
                id: loadItemId
            });

            let setHazmatGoodValue = loadItem.getValue({
                fieldId: 'ishazmatitem'
            });

            if(_logValidation(setHazmatGoodValue)){
                
                record.submitFields({
                    type: loadItemType,
                    id: loadItemId,
                    values: {
                        custitem_hazmat_good_hide: setHazmatGoodValue
                    },
                    options: {
                        ignoreMandatoryFields : true
                    }

                });
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


        return {
            afterSubmit: afterSubmit
        };
    }
);
