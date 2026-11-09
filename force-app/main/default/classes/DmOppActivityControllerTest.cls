@IsTest
private class DmOppActivityControllerTest {
    @IsTest
    static void activityAndRoles() {
        Account a = new Account(Name = 'Act Test Co');
        insert a;
        Contact c1 = new Contact(AccountId = a.Id, FirstName = 'Pat', LastName = 'Champion', Title = 'VP Marketing');
        Contact c2 = new Contact(AccountId = a.Id, FirstName = 'Quinn', LastName = 'Silent', Title = null);
        insert new List<Contact>{ c1, c2 };
        Opportunity o = new Opportunity(
            Name = 'Act Opp', AccountId = a.Id, StageName = '0. Identify', CloseDate = Date.today().addDays(60), Type = 'New Customer',
            ACV_change_RevIntel__c = 50000, S1_Origin__c = 'Inbound', Mutual_Fit_Confirmed__c = true,
            Champion__c = 'Pat Champion', Next_Step__c = 'Call Pat Champion'
        );
        insert o;
        insert new OpportunityContactRole(OpportunityId = o.Id, ContactId = c1.Id, Role = 'Champion', IsPrimary = true);
        insert new OpportunityContactRole(OpportunityId = o.Id, ContactId = c2.Id);

        List<Task> ts = new List<Task>{
            new Task(WhatId = o.Id, WhoId = c1.Id, Subject = 'Sent', Type = 'Email', Status = 'Completed', ActivityDate = Date.today()),
            new Task(WhatId = o.Id, WhoId = c1.Id, Subject = 'Reply', Type = 'Email In', Status = 'Completed', ActivityDate = Date.today()),
            new Task(WhatId = o.Id, WhoId = c1.Id, Subject = 'Promo', Type = 'Marketing Email', Status = 'Completed', ActivityDate = Date.today()),
            new Task(WhatId = o.Id, WhoId = c1.Id, Subject = 'Call', Type = 'Call', Status = 'Completed', ActivityDate = Date.today()),
            new Task(WhatId = o.Id, Subject = 'LinkedIn', Type = 'LinkedIn Message Sent', Status = 'Completed', ActivityDate = Date.today())
        };
        insert ts;
        insert new Event(WhatId = o.Id, WhoId = c1.Id, Subject = 'Demo', StartDateTime = System.now().addDays(-2), EndDateTime = System.now().addDays(-2).addHours(1));

        List<Deal_Milestones__c> dms = [SELECT Id FROM Deal_Milestones__c WHERE Opportunity__c = :o.Id LIMIT 1];
        if (dms.isEmpty()) {
            insert new Deal_Milestones__c(Opportunity__c = o.Id);
            dms = [SELECT Id FROM Deal_Milestones__c WHERE Opportunity__c = :o.Id LIMIT 1];
        }

        Test.startTest();
        DmOppActivityController.Result r = DmOppActivityController.getActivity(dms[0].Id);
        Test.stopTest();

        System.assertEquals(true, r.hasOpp);
        System.assertEquals(8, r.weeks.size());
        System.assertEquals(5, r.timeline.size(), 'Marketing email is excluded');
        System.assertEquals(String.valueOf(Date.today()), r.lastEmailIn);
        System.assertNotEquals(null, r.lastMeeting);
        System.assertEquals(2, r.contactsTotal);
        System.assertEquals(1, r.contactsTouched);
        System.assertEquals(2, r.people.size());
        DmOppActivityController.Person first = r.people[0];
        System.assertEquals('Pat Champion', first.name);
        System.assertEquals('VP', first.level);
        System.assert(first.tags.contains('Named in Champion'));
        System.assert(first.tags.contains('Primary contact'));
        System.assert(!r.roleFields.isEmpty());
    }

    @IsTest
    static void edgeCases() {
        System.assertEquals(false, DmOppActivityController.getActivity(null).hasOpp);
        System.assertEquals('C-level', DmOppActivityController.levelOf('Chief Marketing Officer'));
        System.assertEquals('VP', DmOppActivityController.levelOf('VP of Growth'));
        System.assertEquals('Director', DmOppActivityController.levelOf('Director, CRM'));
        System.assertEquals('Manager', DmOppActivityController.levelOf('Marketing Manager'));
        System.assertEquals(null, DmOppActivityController.levelOf('Analyst'));
        System.assertEquals(null, DmOppActivityController.levelOf(null));
        System.assertEquals('momentum', DmOppActivityController.kindOf(new Task(Type = 'Momentum AI Summary', TaskSubtype = 'Call')));
        System.assertEquals('other', DmOppActivityController.kindOf(new Task(Type = 'InMail')));
    }

    @isTest
    static void accountActivityHandlesMissingRecord() {
        Id fake = Deal_Milestones__c.SObjectType.getDescribe().getKeyPrefix() + '000000000000AAA';
        System.assertEquals(false, DmOppActivityController.getAccountActivity(fake).hasOpp);
    }
}