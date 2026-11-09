public without sharing class PhPartnerOverlapController {
    public class Partner {
        @AuraEnabled public String name;
        @AuraEnabled public Boolean customer = false;
        @AuraEnabled public Boolean openOpp = false;
        @AuraEnabled public String rep;
        @AuraEnabled public String repTitle;
        @AuraEnabled public String partnerType;
        @AuraEnabled public String lastChange;
    }

    // Crossbeam overlap for the account on a Deal Health record. Customers and open opportunities only.
    // Without sharing so reps see overlap without object access to the Crossbeam package.
    @AuraEnabled(cacheable=true)
    public static List<Partner> getOverlap(Id recordId) {
        List<Deal_Milestones__c> recs = [SELECT Account__c FROM Deal_Milestones__c WHERE Id = :recordId LIMIT 1];
        if (recs.isEmpty() || recs[0].Account__c == null) {
            return new List<Partner>();
        }
        return overlapFor(recs[0].Account__c);
    }

    @TestVisible
    private static List<Partner> overlapFor(Id acct) {
        Map<String, Partner> byName = new Map<String, Partner>();
        for (xbeamprod__Overlap__c o : [
            SELECT xbeamprod__Partner_Name__c, xbeamprod__Partner_Standard_Populations__c,
                xbeamprod__Partner_Record_Owner_Name__c, xbeamprod__Partner_Record_Owner_Title__c,
                xbeamprod__Partner_Account__r.Partner_Type__c, LastModifiedDate
            FROM xbeamprod__Overlap__c
            WHERE xbeamprod__Account__c = :acct
                AND xbeamprod__Partner_Standard_Populations__c INCLUDES ('Customers', 'Open Opportunities')
            LIMIT 2000
        ]) {
            mergeRow(byName, o.xbeamprod__Partner_Name__c, o.xbeamprod__Partner_Standard_Populations__c,
                o.xbeamprod__Partner_Record_Owner_Name__c, o.xbeamprod__Partner_Record_Owner_Title__c,
                o.xbeamprod__Partner_Account__r?.Partner_Type__c, o.LastModifiedDate.date());
        }
        List<Partner> out = byName.values();
        List<Partner> open = new List<Partner>();
        List<Partner> rest = new List<Partner>();
        for (Partner p : out) {
            if (p.openOpp) {
                open.add(p);
            } else {
                rest.add(p);
            }
        }
        open.addAll(rest);
        return open;
    }

    @TestVisible
    private static void mergeRow(Map<String, Partner> byName, String name, String pops, String rep, String title, String ptype, Date changed) {
        String n = String.isBlank(name) ? null : name.trim();
        if (n == null) {
            return;
        }
        Partner p = byName.get(n);
        if (p == null) {
            p = new Partner();
            p.name = n;
            byName.put(n, p);
        }
        List<String> parts = String.isBlank(pops) ? new List<String>() : pops.split(';');
        p.customer = p.customer || parts.contains('Customers');
        p.openOpp = p.openOpp || parts.contains('Open Opportunities');
        if (p.rep == null && !String.isBlank(rep) && rep != 'Self Service User') {
            p.rep = rep;
            p.repTitle = title;
        }
        if (p.partnerType == null) {
            p.partnerType = ptype;
        }
        String d = changed == null ? null : String.valueOf(changed);
        if (d != null && (p.lastChange == null || d > p.lastChange)) {
            p.lastChange = d;
        }
    }
}