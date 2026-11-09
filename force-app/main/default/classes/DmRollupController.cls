public with sharing class DmRollupController {

    public class Row {
        @AuraEnabled public Id recordId;
        @AuraEnabled public String oppName;
        @AuraEnabled public Id ownerId;
        @AuraEnabled public String ownerName;
        @AuraEnabled public String recordType;
        @AuraEnabled public String stage;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public Date closeDate;
        @AuraEnabled public Decimal confidence;
        @AuraEnabled public String healthCategory;
        @AuraEnabled public Decimal done;
        @AuraEnabled public Decimal total;
    }

    public class Result {
        @AuraEnabled public Boolean hasTeam = false;
        @AuraEnabled public Integer teamSize = 0;
        @AuraEnabled public String scope = 'mine';
        @AuraEnabled public String userName;
        @AuraEnabled public List<Row> rows = new List<Row>();
    }

    // scope: 'mine' = opportunities the running user owns, 'team' = opportunities owned by users in roles below the running user.
    @AuraEnabled
    public static Result getRollup(String scope) {
        Result res = new Result();
        res.userName = UserInfo.getName();
        Map<Id, User> team = subordinateUsers();
        res.hasTeam = !team.isEmpty();
        res.teamSize = team.size();
        Boolean wantTeam = scope == 'team' && res.hasTeam;
        res.scope = wantTeam ? 'team' : 'mine';
        Set<Id> ownerIds = wantTeam ? team.keySet() : new Set<Id>{ UserInfo.getUserId() };

        List<Deal_Milestones__c> recs = [
            SELECT Id, RecordType.Name, Opportunity__c, Opportunity__r.Name, Opportunity__r.OwnerId,
                   Opportunity__r.Owner.Name, Opportunity__r.Amount, Opportunity__r.CloseDate,
                   Opportunity__r.StageName, Close_Likelihood_Score__c, Health_Category__c,
                   PH_Done_Through_Stage__c, PH_Total_Through_Stage__c
            FROM Deal_Milestones__c
            WHERE Opportunity__r.IsClosed = false AND Opportunity__r.OwnerId IN :ownerIds
            ORDER BY Opportunity__r.CloseDate ASC NULLS LAST
            LIMIT 1000
        ];
        // Fields the user cannot read come back empty instead of failing the whole call.
        SObjectAccessDecision safe = Security.stripInaccessible(AccessType.READABLE, recs);
        for (SObject so : safe.getRecords()) {
            res.rows.add(toRow((Deal_Milestones__c) so));
        }
        return res;
    }

    @TestVisible
    private static Row toRow(Deal_Milestones__c d) {
        Row r = new Row();
        r.recordId = d.Id;
        r.recordType = d.RecordType != null ? d.RecordType.Name : null;
        Opportunity o = d.Opportunity__r;
        if (o != null) {
            r.oppName = o.Name;
            r.ownerId = o.OwnerId;
            r.ownerName = o.Owner != null ? o.Owner.Name : null;
            r.amount = o.Amount;
            r.closeDate = o.CloseDate;
            r.stage = o.StageName;
        }
        r.confidence = d.Close_Likelihood_Score__c;
        r.healthCategory = d.Health_Category__c;
        r.done = d.PH_Done_Through_Stage__c;
        r.total = d.PH_Total_Through_Stage__c;
        return r;
    }

    // Everyone in roles below the running user in the role hierarchy. Empty when the user has no role or no reports.
    @TestVisible
    private static Map<Id, User> subordinateUsers() {
        Id roleId = [SELECT UserRoleId FROM User WHERE Id = :UserInfo.getUserId()].UserRoleId;
        if (roleId == null) {
            return new Map<Id, User>();
        }
        Set<Id> roles = new Set<Id>();
        Set<Id> frontier = new Set<Id>{ roleId };
        for (Integer depth = 0; depth < 15 && !frontier.isEmpty(); depth++) {
            Set<Id> next = new Set<Id>();
            for (UserRole ur : [SELECT Id FROM UserRole WHERE ParentRoleId IN :frontier]) {
                if (roles.add(ur.Id)) {
                    next.add(ur.Id);
                }
            }
            frontier = next;
        }
        if (roles.isEmpty()) {
            return new Map<Id, User>();
        }
        return new Map<Id, User>([SELECT Id, Name FROM User WHERE IsActive = true AND UserRoleId IN :roles]);
    }
}