@isTest
private class PhScoreHistoryControllerTest {
    @isTest
    static void toPointMapsSeries() {
        PhScoreHistoryController.Point a = PhScoreHistoryController.toPoint('Close_Likelihood_Score__c', 45, Datetime.newInstanceGmt(2026, 6, 11, 12, 0, 0));
        System.assertEquals('a', a.series);
        System.assertEquals('2026-06-11', a.day);
        System.assertEquals(45, a.value);
        System.assertEquals('b', PhScoreHistoryController.toPoint('Key_Milestone_Score__c', 66, Datetime.now()).series);
        System.assertEquals(null, PhScoreHistoryController.toPoint('Key_Milestone_Score__c', null, Datetime.now()));
    }

    @isTest
    static void getHistoryEmptyForUnknownRecord() {
        Id fake = Deal_Milestones__c.SObjectType.getDescribe().getKeyPrefix() + '000000000000AAA';
        System.assertEquals(0, PhScoreHistoryController.getHistory(fake).size());
    }
}