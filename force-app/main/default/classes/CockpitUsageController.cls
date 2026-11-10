/**
 * Writes AE and BDR Cockpit usage to Cockpit_Usage_Day__c.
 * The cockpit batches counts in the browser and sends them about once a minute
 * and when the tab is hidden. One row per seller, cockpit and day; each call adds to it.
 * Tracking must never break the page, so every failure is swallowed and logged.
 */
public without sharing class CockpitUsageController {

    // Keys the cockpit may send, mapped to the field each one adds to.
    @TestVisible
    private static final Map<String, Schema.SObjectField> COUNTERS = new Map<String, Schema.SObjectField>{
        'session'          => Cockpit_Usage_Day__c.Sessions__c,
        'tab:day'          => Cockpit_Usage_Day__c.Views_My_Day__c,
        'tab:actions'      => Cockpit_Usage_Day__c.Views_Immediate_Actions__c,
        'tab:pipe'         => Cockpit_Usage_Day__c.Views_Pipeline_Forecast__c,
        'tab:protect'      => Cockpit_Usage_Day__c.Views_Pipeline_Forecast__c,
        'tab:build'        => Cockpit_Usage_Day__c.Views_Build_Pipeline__c,
        'tab:forecast'     => Cockpit_Usage_Day__c.Views_My_Number__c,
        'tab:accounts'     => Cockpit_Usage_Day__c.Views_Account_Intel__c,
        'record:open'      => Cockpit_Usage_Day__c.Records_Opened__c,
        'action:done'      => Cockpit_Usage_Day__c.Actions_Completed__c,
        'action:dismiss'   => Cockpit_Usage_Day__c.Actions_Dismissed__c,
        'update:save'      => Cockpit_Usage_Day__c.Updates_Saved__c,
        'email:draft'      => Cockpit_Usage_Day__c.Emails_Drafted__c,
        'assistant:ask'    => Cockpit_Usage_Day__c.Assistant_Questions__c,
        'account:lookup'   => Cockpit_Usage_Day__c.Lookups__c
    };

    // A single flush can't add more than this to any one counter. Guards against a stuck loop.
    @TestVisible
    private static final Integer MAX_PER_FLUSH = 200;
    @TestVisible
    private static final Integer MAX_ACTIVE_MINUTES_PER_FLUSH = 30;

    public class Batch {
        public String cockpit;
        public Map<String, Integer> counts;
        public Integer activeSeconds;
    }

    /**
     * payloadJson: {"cockpit":"AE","counts":{"session":1,"tab:day":2},"activeSeconds":45}
     * Returns true when the counts were saved. The page ignores the result.
     */
    @AuraEnabled
    public static Boolean track(String payloadJson) {
        try {
            Batch b = (Batch) JSON.deserialize(payloadJson, Batch.class);
            return save(b, UserInfo.getUserId(), Date.today(), Datetime.now());
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'Cockpit usage not saved: ' + e.getMessage());
            return false;
        }
    }

    @TestVisible
    private static Boolean save(Batch b, Id userId, Date day, Datetime now) {
        if (b == null) {
            return false;
        }
        String cockpit = (b.cockpit == 'BDR') ? 'BDR' : 'AE';
        Map<Schema.SObjectField, Integer> adds = new Map<Schema.SObjectField, Integer>();
        if (b.counts != null) {
            for (String k : b.counts.keySet()) {
                Schema.SObjectField fld = COUNTERS.get(k);
                Integer n = b.counts.get(k);
                if (fld == null || n == null || n <= 0) {
                    continue;
                }
                Integer prior = adds.containsKey(fld) ? adds.get(fld) : 0;
                adds.put(fld, Math.min(prior + n, MAX_PER_FLUSH));
            }
        }
        Decimal minutes = 0;
        if (b.activeSeconds != null && b.activeSeconds > 0) {
            minutes = Math.min((b.activeSeconds / 60.0).setScale(1), (Decimal) MAX_ACTIVE_MINUTES_PER_FLUSH);
        }
        if (adds.isEmpty() && minutes == 0) {
            return false;
        }

        String key = String.valueOf(userId).left(15) + '-' + cockpit + '-' + String.valueOf(day);
        for (Integer attempt = 0; attempt < 2; attempt++) {
            List<Cockpit_Usage_Day__c> rows = [
                SELECT Id, First_Seen__c, Active_Minutes__c, Sessions__c,
                       Views_My_Day__c, Views_Immediate_Actions__c, Views_Pipeline_Forecast__c,
                       Views_Build_Pipeline__c, Views_My_Number__c, Views_Account_Intel__c,
                       Records_Opened__c, Actions_Completed__c, Actions_Dismissed__c,
                       Updates_Saved__c, Emails_Drafted__c, Assistant_Questions__c, Lookups__c
                FROM Cockpit_Usage_Day__c
                WHERE Usage_Key__c = :key
                LIMIT 1
                FOR UPDATE
            ];
            Cockpit_Usage_Day__c row = rows.isEmpty()
                ? new Cockpit_Usage_Day__c(
                    Usage_Key__c = key, User__c = userId, OwnerId = userId,
                    Usage_Date__c = day, Cockpit__c = cockpit, First_Seen__c = now)
                : rows[0];
            for (Schema.SObjectField fld : adds.keySet()) {
                Decimal cur = (Decimal) row.get(fld);
                row.put(fld, (cur == null ? 0 : cur) + adds.get(fld));
            }
            Decimal act = row.Active_Minutes__c;
            row.Active_Minutes__c = (act == null ? 0 : act) + minutes;
            row.Last_Seen__c = now;
            try {
                if (row.Id == null) {
                    insert row;
                } else {
                    update row;
                }
                return true;
            } catch (DmlException e) {
                // Two cockpit tabs can insert the first row of the day at the same time.
                // The unique key rejects the second; read the row again and add to it.
                if (e.getDmlType(0) != StatusCode.DUPLICATE_VALUE || attempt == 1) {
                    throw e;
                }
            }
        }
        return false;
    }
}
