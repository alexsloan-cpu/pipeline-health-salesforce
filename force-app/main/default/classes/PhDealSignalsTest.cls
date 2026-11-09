@isTest
private class PhDealSignalsTest {
    @isTest
    static void rockAndSeniorReads() {
        System.assertEquals('p', PhDealSignals.rockCode(null));
        System.assertEquals('k', PhDealSignals.rockCode('Known: budget approved'));
        System.assertEquals('a', PhDealSignals.rockCode('Partial: some of it'));
        System.assertEquals('n', PhDealSignals.rockCode('Not yet known: nothing'));
        System.assertEquals('a', PhDealSignals.rockCode('free text with no label'));
        System.assertEquals(true, PhDealSignals.isSenior('VP Marketing'));
        System.assertEquals(true, PhDealSignals.isSenior('Director of Growth'));
        System.assertEquals(false, PhDealSignals.isSenior('Marketing Manager'));
    }

    @isTest
    static void emptyAndTooMany() {
        System.assertEquals(0, PhDealSignals.getSignals(null).size());
        System.assertEquals(0, PhDealSignals.getSignals(new List<Id>()).size());
        List<Id> many = new List<Id>();
        Id fake = Deal_Milestones__c.SObjectType.getDescribe().getKeyPrefix() + '000000000000AAA';
        for (Integer i = 0; i < 201; i++) {
            many.add(fake);
        }
        Boolean threw = false;
        try {
            PhDealSignals.getSignals(many);
        } catch (AuraHandledException e) {
            threw = true;
        }
        System.assert(threw);
    }

    @isTest
    static void postSalesByAccount() {
        Account a = new Account(Name = 'Signal Acct');
        Database.DMLOptions o = new Database.DMLOptions();
        o.duplicateRuleHeader.allowSave = true;
        Database.insert(a, o);
        Contact c = new Contact(LastName = 'Lee', Title = 'VP Marketing', AccountId = a.Id);
        Database.insert(c, o);
        Opportunity op = new Opportunity(
            Name = 'Signal Opp', AccountId = a.Id, StageName = '0. Identify', CloseDate = Date.today().addDays(60), Type = 'New Customer',
            ACV_change_RevIntel__c = 50000, S1_Origin__c = 'Inbound', Mutual_Fit_Confirmed__c = true,
            Champion__c = 'Pat Champion', Next_Step__c = 'Call Pat Champion'
        );
        insert op;
        insert new Deal_Milestones__c(Opportunity__c = op.Id, Account__c = a.Id, Usage_Status__c = 'Over',
            Tightest_Channel__c = 'Email', Tightest_Channel_Pct__c = 120, Estimated_Overage__c = 500);
        insert new Event(WhatId = a.Id, WhoId = c.Id, Subject = 'Call', StartDateTime = System.now().addDays(-2), DurationInMinutes = 15);
        insert new Task(WhatId = a.Id, Subject = 'In', Type = 'Email In', Status = 'Completed', ActivityDate = Date.today().addDays(-5));

        Deal_Milestones__c r = (Deal_Milestones__c) JSON.deserialize(
            '{"attributes":{"type":"Deal_Milestones__c"},"Account__c":"' + a.Id + '","PH_Set__c":"Post"}', Deal_Milestones__c.class);
        PhDealSignals.Sig s = PhDealSignals.assemble(new List<Deal_Milestones__c>{ r })[0];
        System.assertEquals(2, s.days);
        System.assertEquals(1, s.people);
        System.assertEquals(1, s.senior);
        System.assertEquals('Over', s.uStat);
        System.assertEquals('Email', s.uTop);
        System.assertEquals(500, s.uEst);
    }

    @isTest
    static void newBusinessRocks() {
        Deal_Milestones__c r = (Deal_Milestones__c) JSON.deserialize(
            '{"attributes":{"type":"Deal_Milestones__c"},"PH_Set__c":"NB","Big_Rock_1_Business_Problem__c":"Known: yes","Big_Rock_2_Why_Now__c":"Partial: some"}', Deal_Milestones__c.class);
        PhDealSignals.Sig s = PhDealSignals.assemble(new List<Deal_Milestones__c>{ r })[0];
        System.assertEquals('kappp', s.rocks);
        System.assertEquals(1, s.known);
        System.assertEquals(2, s.filled);
        System.assertEquals(null, s.days);
    }
}