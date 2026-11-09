@isTest
private class PhPartnerOverlapControllerTest {
    @isTest
    static void rowDedupesAndDropsSelfService() {
        Map<String, PhPartnerOverlapController.Partner> m = new Map<String, PhPartnerOverlapController.Partner>();
        PhPartnerOverlapController.mergeRow(m, 'Snowflake ', 'Customers', 'Self Service User', null, null, Date.newInstance(2026, 1, 1));
        PhPartnerOverlapController.mergeRow(m, 'Snowflake', 'Open Opportunities;Prospects', 'Pat Rep', 'AE', 'Technology', Date.newInstance(2026, 2, 1));
        PhPartnerOverlapController.mergeRow(m, null, 'Customers', null, null, null, null);
        System.assertEquals(1, m.size());
        PhPartnerOverlapController.Partner p = m.get('Snowflake');
        System.assert(p.customer);
        System.assert(p.openOpp);
        System.assertEquals('Pat Rep', p.rep);
        System.assertEquals('2026-02-01', p.lastChange);
    }

    @isTest
    static void getOverlapHandlesMissingRecord() {
        Id fake = Deal_Milestones__c.SObjectType.getDescribe().getKeyPrefix() + '000000000000AAA';
        System.assertEquals(0, PhPartnerOverlapController.getOverlap(fake).size());
    }

    @isTest
    static void getOverlapReadsAccount() {
        Account a = new Account(Name = 'Overlap Test');
        Database.DMLOptions o = new Database.DMLOptions();
        o.duplicateRuleHeader.allowSave = true;
        Database.insert(a, o);
        insert new xbeamprod__Overlap__c(xbeamprod__Account__c = a.Id, xbeamprod__Partner_Name__c = 'Twilio', xbeamprod__Partner_Standard_Populations__c = 'Customers', xbeamprod__Crossbeam_EID__c = 'test-eid-1');
        List<PhPartnerOverlapController.Partner> out = PhPartnerOverlapController.overlapFor(a.Id);
        System.assertEquals(1, out.size());
        System.assert(out[0].customer);
    }
}