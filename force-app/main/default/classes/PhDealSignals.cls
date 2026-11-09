// Contact, usage and big rock signals for the Deal Command Center. The page calls this after the dashboard loads,
// in chunks, so a failure here never affects the dashboard itself.
public with sharing class PhDealSignals {
    private static final Integer MAX_IDS = 200;
    private static final Integer GROUP_CAP = 2000;
    private static final Integer ROW_CAP = 25000;

    public class Sig {
        @AuraEnabled public Id recordId;
        @AuraEnabled public Integer days;
        @AuraEnabled public Integer people = 0;
        @AuraEnabled public Integer senior = 0;
        @AuraEnabled public Integer known = 0;
        @AuraEnabled public Integer filled = 0;
        @AuraEnabled public String rocks;
        @AuraEnabled public String uStat;
        @AuraEnabled public String uTop;
        @AuraEnabled public Decimal uPct;
        @AuraEnabled public Decimal uEst;
    }

    // The record query runs with sharing, so only deals this user can see come back.
    @AuraEnabled
    public static List<Sig> getSignals(List<Id> recordIds) {
        List<Sig> out = new List<Sig>();
        if (recordIds == null || recordIds.isEmpty()) {
            return out;
        }
        if (recordIds.size() > MAX_IDS) {
            throw new AuraHandledException('Too many records in one call.');
        }
        return assemble([
            SELECT Id, Opportunity__c, Account__c, PH_Set__c, Big_Rock_1_Business_Problem__c, Big_Rock_2_Why_Now__c,
                   Big_Rock_3_Current_State__c, Big_Rock_4_Tech_Competition__c, Big_Rock_5_Buying_Process__c
            FROM Deal_Milestones__c WHERE Id IN :recordIds
        ]);
    }

    @TestVisible
    private static List<Sig> assemble(List<Deal_Milestones__c> recs) {
        List<Sig> out = new List<Sig>();
        Set<Id> opps = new Set<Id>();
        Set<Id> accts = new Set<Id>();
        for (Deal_Milestones__c r : recs) {
            if (r.PH_Set__c == 'NB') {
                if (r.Opportunity__c != null) { opps.add(r.Opportunity__c); }
            } else if (r.Account__c != null) {
                accts.add(r.Account__c);
            }
        }
        Roll roll = new Reader().read(opps, accts);
        for (Deal_Milestones__c r : recs) {
            Boolean nb = r.PH_Set__c == 'NB';
            Id key = nb ? r.Opportunity__c : r.Account__c;
            Sig s = new Sig();
            s.recordId = r.Id;
            Date last = roll.last.get(key);
            s.days = last == null ? null : last.daysBetween(Date.today());
            s.people = roll.people.containsKey(key) ? roll.people.get(key).size() : 0;
            s.senior = roll.countSenior(key);
            if (nb) {
                setRocks(s, r);
            } else {
                setUsage(s, roll.usage.get(key));
            }
            out.add(s);
        }
        return out;
    }

    private static void setUsage(Sig s, Deal_Milestones__c u) {
        if (u == null) {
            return;
        }
        s.uStat = u.Usage_Status__c;
        s.uTop = u.Tightest_Channel__c;
        s.uPct = u.Tightest_Channel_Pct__c;
        s.uEst = u.Estimated_Overage__c;
    }

    private static void setRocks(Sig s, Deal_Milestones__c r) {
        String codes = '';
        for (String t : new List<String>{
            r.Big_Rock_1_Business_Problem__c, r.Big_Rock_2_Why_Now__c, r.Big_Rock_3_Current_State__c,
            r.Big_Rock_4_Tech_Competition__c, r.Big_Rock_5_Buying_Process__c
        }) {
            String c = rockCode(t);
            codes += c;
            if (c == 'k') { s.known++; }
            if (c != 'p') { s.filled++; }
        }
        s.rocks = codes;
    }

    // k known, a partial, n not yet known, p nothing written yet. Same read as the Big Rocks tile.
    @TestVisible
    private static String rockCode(String t) {
        if (String.isBlank(t)) { return 'p'; }
        String l = t.trim().toLowerCase();
        if (l.startsWith('known')) { return 'k'; }
        if (l.startsWith('not yet known')) { return 'n'; }
        return 'a';
    }

    // The same title read as DmOppActivityController, for C-level, VP and Director.
    @TestVisible
    private static Boolean isSenior(String title) {
        String lvl = DmOppActivityController.levelOf(title);
        return lvl == 'C-level' || lvl == 'VP' || lvl == 'Director';
    }

    private class Roll {
        Map<Id, Date> last = new Map<Id, Date>();
        Map<Id, Set<Id>> people = new Map<Id, Set<Id>>();
        Map<Id, Deal_Milestones__c> usage = new Map<Id, Deal_Milestones__c>();
        Set<Id> seniorIds = new Set<Id>();

        void touch(Id key, Date d) {
            if (key != null && d != null && d <= Date.today() && (!last.containsKey(key) || d > last.get(key))) {
                last.put(key, d);
            }
        }
        void person(Id key, Id who) {
            if (key == null || who == null || who.getSObjectType() != Contact.SObjectType) {
                return;
            }
            if (!people.containsKey(key)) {
                people.put(key, new Set<Id>());
            }
            people.get(key).add(who);
        }
        Integer countSenior(Id key) {
            Integer n = 0;
            if (people.containsKey(key)) {
                for (Id c : people.get(key)) {
                    if (seniorIds.contains(c)) { n++; }
                }
            }
            return n;
        }
    }

    // System mode for activity and usage: only rollups of deals the user can already see leave this class.
    private without sharing class Reader {
        Roll read(Set<Id> opps, Set<Id> accts) {
            Roll r = new Roll();
            Datetime nowDt = System.now();
            Datetime peopleFrom = nowDt.addDays(-90);
            Date today = Date.today();
            Date yearAgo = today.addDays(-365);
            Date peopleDay = today.addDays(-90);
            if (!opps.isEmpty()) {
                for (Task t : [
                    SELECT WhatId, ActivityDate FROM Task
                    WHERE WhatId IN :opps AND IsClosed = true AND Type IN ('Email In', 'Momentum AI Summary')
                      AND ActivityDate >= :yearAgo AND ActivityDate <= :today
                    ORDER BY ActivityDate DESC LIMIT :ROW_CAP
                ]) {
                    r.touch(t.WhatId, t.ActivityDate);
                }
                for (AggregateResult a : [SELECT WhatId k, MAX(StartDateTime) d FROM Event WHERE WhatId IN :opps AND StartDateTime <= :nowDt AND StartDateTime = LAST_N_DAYS:365 GROUP BY WhatId]) {
                    r.touch((Id) a.get('k'), ((Datetime) a.get('d')).date());
                }
                for (AggregateResult a : [SELECT WhatId k, WhoId w FROM Task WHERE WhatId IN :opps AND WhoId != null AND IsClosed = true AND Type != 'Marketing Email' AND ActivityDate >= :peopleDay AND ActivityDate <= :today GROUP BY WhatId, WhoId LIMIT :GROUP_CAP]) {
                    r.person((Id) a.get('k'), (Id) a.get('w'));
                }
                for (AggregateResult a : [SELECT WhatId k, WhoId w FROM Event WHERE WhatId IN :opps AND WhoId != null AND StartDateTime >= :peopleFrom AND StartDateTime <= :nowDt GROUP BY WhatId, WhoId LIMIT :GROUP_CAP]) {
                    r.person((Id) a.get('k'), (Id) a.get('w'));
                }
            }
            if (!accts.isEmpty()) {
                for (Task t : [
                    SELECT AccountId, ActivityDate FROM Task
                    WHERE AccountId IN :accts AND IsClosed = true AND Type IN ('Email In', 'Momentum AI Summary')
                      AND ActivityDate >= :yearAgo AND ActivityDate <= :today
                    ORDER BY ActivityDate DESC LIMIT :ROW_CAP
                ]) {
                    r.touch(t.AccountId, t.ActivityDate);
                }
                for (AggregateResult a : [SELECT AccountId k, MAX(StartDateTime) d FROM Event WHERE AccountId IN :accts AND StartDateTime <= :nowDt AND StartDateTime = LAST_N_DAYS:365 GROUP BY AccountId]) {
                    r.touch((Id) a.get('k'), ((Datetime) a.get('d')).date());
                }
                for (AggregateResult a : [SELECT AccountId k, WhoId w FROM Task WHERE AccountId IN :accts AND WhoId != null AND IsClosed = true AND Type != 'Marketing Email' AND ActivityDate >= :peopleDay AND ActivityDate <= :today GROUP BY AccountId, WhoId LIMIT :GROUP_CAP]) {
                    r.person((Id) a.get('k'), (Id) a.get('w'));
                }
                for (AggregateResult a : [SELECT AccountId k, WhoId w FROM Event WHERE AccountId IN :accts AND WhoId != null AND StartDateTime >= :peopleFrom AND StartDateTime <= :nowDt GROUP BY AccountId, WhoId LIMIT :GROUP_CAP]) {
                    r.person((Id) a.get('k'), (Id) a.get('w'));
                }
            }
            Set<Id> who = new Set<Id>();
            for (Set<Id> v : r.people.values()) {
                who.addAll(v);
            }
            for (Contact c : [SELECT Id, Title FROM Contact WHERE Id IN :who AND Title != null]) {
                if (isSenior(c.Title)) {
                    r.seniorIds.add(c.Id);
                }
            }
            // Usage is written onto the Deal Health records. Oldest sync first, so the newest one on an account wins.
            if (!accts.isEmpty()) {
                for (Deal_Milestones__c u : [
                    SELECT Account__c, Usage_Status__c, Tightest_Channel__c, Tightest_Channel_Pct__c, Estimated_Overage__c
                    FROM Deal_Milestones__c WHERE Account__c IN :accts AND Usage_Status__c != null
                    ORDER BY Usage_Last_Synced__c ASC NULLS FIRST LIMIT :GROUP_CAP
                ]) {
                    r.usage.put(u.Account__c, u);
                }
            }
            return r;
        }
    }
}