public with sharing class PhScoreHistoryController {
    public class Point {
        @AuraEnabled public String series;
        @AuraEnabled public String day;
        @AuraEnabled public Decimal value;
    }

    // Field history for Close Health and Key Milestone Score. Last change of each day wins.
    @AuraEnabled(cacheable=true)
    public static List<Point> getHistory(Id recordId) {
        List<Point> out = new List<Point>();
        for (Deal_Milestones__History h : [
            SELECT Field, NewValue, CreatedDate FROM Deal_Milestones__History
            WHERE ParentId = :recordId AND Field IN ('Close_Likelihood_Score__c', 'Key_Milestone_Score__c')
            ORDER BY CreatedDate ASC
            LIMIT 2000
        ]) {
            Point p = toPoint(h.Field, h.NewValue, h.CreatedDate);
            if (p != null) {
                out.add(p);
            }
        }
        return out;
    }

    @TestVisible
    private static Point toPoint(String field, Object newValue, Datetime created) {
        if (newValue == null) {
            return null;
        }
        Point p = new Point();
        p.series = field == 'Close_Likelihood_Score__c' ? 'a' : 'b';
        p.day = created.formatGmt('yyyy-MM-dd');
        p.value = Decimal.valueOf(String.valueOf(newValue));
        return p;
    }
}