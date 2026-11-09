// Generated from the four Deal Milestones record pages. Milestone groups per layout.
export const LAYOUTS = {
    "newBusiness": {
        "fields": [
            "Deal_Milestones__c.Stage_0_Complete__c",
            "Deal_Milestones__c.Stage_0_Total__c",
            "Deal_Milestones__c.S0_Health__c",
            "Deal_Milestones__c.Stage_1_Complete__c",
            "Deal_Milestones__c.Stage_1_Total__c",
            "Deal_Milestones__c.S1_Health__c",
            "Deal_Milestones__c.Stage_2_Complete__c",
            "Deal_Milestones__c.Stage_2_Total__c",
            "Deal_Milestones__c.S2_Health__c",
            "Deal_Milestones__c.Stage_3_Complete__c",
            "Deal_Milestones__c.Stage_3_Total__c",
            "Deal_Milestones__c.S3_Health__c",
            "Deal_Milestones__c.Stage_4_Complete__c",
            "Deal_Milestones__c.Stage_4_Total__c",
            "Deal_Milestones__c.S4_Health__c",
            "Deal_Milestones__c.Stage_5_Complete__c",
            "Deal_Milestones__c.Stage_5_Total__c",
            "Deal_Milestones__c.S5_Health__c",
            "Deal_Milestones__c.S0_Milestone_Overview__c",
            "Deal_Milestones__c.S0_Milestone_Score__c",
            "Deal_Milestones__c.S1_Milestone_Overview__c",
            "Deal_Milestones__c.S1_Milestone_Score__c",
            "Deal_Milestones__c.FundingDetermined_S1__c",
            "Deal_Milestones__c.FundingDetermined_Reason_S1__c",
            "Deal_Milestones__c.PainIdentified_S1__c",
            "Deal_Milestones__c.PainIdentified_Reason_S1__c",
            "Deal_Milestones__c.PainWorthInvestingTimeIn_S1__c",
            "Deal_Milestones__c.Scoring_Reason_Pain_Worth_Investing__c",
            "Deal_Milestones__c.S2_Milestone_Overview__c",
            "Deal_Milestones__c.S2_Milestone_Score__c",
            "Deal_Milestones__c.ChampionIdentified_S2__c",
            "Deal_Milestones__c.ChampionIdentified_Reason_S2__c",
            "Deal_Milestones__c.CompetitionIdentified_S2__c",
            "Deal_Milestones__c.CompetitionIdentified_Reason_S2__c",
            "Deal_Milestones__c.WhyIterable_S2__c",
            "Deal_Milestones__c.Scoring_Reason_WhyIterable_S2__c",
            "Deal_Milestones__c.CompellingEventIdentified_S2__c",
            "Deal_Milestones__c.Scoring_Reason_Compelling_Event__c",
            "Deal_Milestones__c.S3_Milestone_Overview__c",
            "Deal_Milestones__c.S3_Milestone_Score__c",
            "Deal_Milestones__c.PurchaseTimelineAgreed_S3__c",
            "Deal_Milestones__c.Scoring_Reason_Timeline_Agreed__c",
            "Deal_Milestones__c.RisksIdentified_S3__c",
            "Deal_Milestones__c.RisksIdentified_Reason_S3__c",
            "Deal_Milestones__c.PartnerEngaged_S3__c",
            "Deal_Milestones__c.TechnicalValidationCompleted_S3__c",
            "Deal_Milestones__c.TechnicalValidation_Reason_S3__c",
            "Deal_Milestones__c.TechnicalFitScore_S3__c",
            "Deal_Milestones__c.ScoringReason_TechnicalFit_S3__c",
            "Deal_Milestones__c.ServicesNeedIdentified_S3__c",
            "Deal_Milestones__c.Scoring_Reason_Services_Identified__c",
            "Deal_Milestones__c.S4_Milestone_Overview__c",
            "Deal_Milestones__c.S4_Milestone_Score__c",
            "Deal_Milestones__c.InitialPricingPresented_S4__c",
            "Deal_Milestones__c.Scoring_Reason_Pricing_Presented__c",
            "Deal_Milestones__c.PaperProcessConfirmed_S4__c",
            "Deal_Milestones__c.PaperProcessConfirmed_Reason_S4__c",
            "Deal_Milestones__c.PricingAlignedAgreed_S4__c",
            "Deal_Milestones__c.Scoring_Reason_Pricing_Aligned__c",
            "Deal_Milestones__c.S5_Milestone_Overview__c",
            "Deal_Milestones__c.S5_Milestone_Score__c",
            "Deal_Milestones__c.LegalITReviewCompleted_S5__c",
            "Deal_Milestones__c.Scoring_Reason_LegalIT_Completed__c",
            "Deal_Milestones__c.ProcurementAligned_S5__c",
            "Deal_Milestones__c.Scoring_Reason_Procurement_Aligned__c"
        ],
        "groups": [
            {
                "key": "s0",
                "title": "Identify",
                "stage": 0,
                "overview": "S0_Milestone_Overview__c",
                "items": [
                    {
                        "score": "PainIdentified_S1__c",
                        "label": "Pain Identified",
                        "max": 5,
                        "reason": "PainIdentified_Reason_S1__c"
                    },
                    {
                        "score": "CompellingEventIdentified_S2__c",
                        "label": "Compelling Event Identified",
                        "max": 5,
                        "reason": "Scoring_Reason_Compelling_Event__c"
                    }
                ]
            },
            {
                "key": "s1",
                "title": "Mutual Interest",
                "stage": 1,
                "overview": "S1_Milestone_Overview__c",
                "items": [
                    {
                        "score": "FundingDetermined_S1__c",
                        "label": "Funding Determined",
                        "max": 5,
                        "reason": "FundingDetermined_Reason_S1__c"
                    },
                    {
                        "score": "PainIdentified_S1__c",
                        "label": "Pain Identified",
                        "max": 5,
                        "reason": "PainIdentified_Reason_S1__c"
                    },
                    {
                        "score": "PainWorthInvestingTimeIn_S1__c",
                        "label": "Pain Worth Investing Time In",
                        "max": 5,
                        "reason": "Scoring_Reason_Pain_Worth_Investing__c"
                    }
                ]
            },
            {
                "key": "s2",
                "title": "Discover",
                "stage": 2,
                "overview": "S2_Milestone_Overview__c",
                "items": [
                    {
                        "score": "ChampionIdentified_S2__c",
                        "label": "Champion Identified",
                        "max": 5,
                        "reason": "ChampionIdentified_Reason_S2__c"
                    },
                    {
                        "score": "CompetitionIdentified_S2__c",
                        "label": "Competition Identified",
                        "max": 3,
                        "reason": "CompetitionIdentified_Reason_S2__c"
                    },
                    {
                        "score": "WhyIterable_S2__c",
                        "label": "Why Iterable",
                        "reason": "Scoring_Reason_WhyIterable_S2__c"
                    },
                    {
                        "score": "CompellingEventIdentified_S2__c",
                        "label": "Compelling Event Identified",
                        "max": 5,
                        "reason": "Scoring_Reason_Compelling_Event__c"
                    }
                ]
            },
            {
                "key": "s3",
                "title": "Validate",
                "stage": 3,
                "overview": "S3_Milestone_Overview__c",
                "items": [
                    {
                        "score": "PurchaseTimelineAgreed_S3__c",
                        "label": "Purchase Timeline Agreed",
                        "reason": "Scoring_Reason_Timeline_Agreed__c"
                    },
                    {
                        "score": "RisksIdentified_S3__c",
                        "label": "Risks Identified",
                        "reason": "RisksIdentified_Reason_S3__c"
                    },
                    {
                        "score": "PartnerEngaged_S3__c",
                        "label": "Partner Engaged/Introduced",
                        "max": 2
                    },
                    {
                        "score": "TechnicalValidationCompleted_S3__c",
                        "label": "Technical Validation Completed",
                        "reason": "TechnicalValidation_Reason_S3__c"
                    },
                    {
                        "score": "TechnicalFitScore_S3__c",
                        "label": "Technical Fit",
                        "reason": "ScoringReason_TechnicalFit_S3__c"
                    },
                    {
                        "score": "ServicesNeedIdentified_S3__c",
                        "label": "Services Need Identified",
                        "reason": "Scoring_Reason_Services_Identified__c"
                    }
                ]
            },
            {
                "key": "s4",
                "title": "Decide",
                "stage": 4,
                "overview": "S4_Milestone_Overview__c",
                "items": [
                    {
                        "score": "InitialPricingPresented_S4__c",
                        "label": "Initial Pricing Presented",
                        "reason": "Scoring_Reason_Pricing_Presented__c"
                    },
                    {
                        "score": "PaperProcessConfirmed_S4__c",
                        "label": "Paper Process Confirmed",
                        "reason": "PaperProcessConfirmed_Reason_S4__c"
                    },
                    {
                        "score": "PricingAlignedAgreed_S4__c",
                        "label": "Pricing Aligned & Agreed",
                        "reason": "Scoring_Reason_Pricing_Aligned__c"
                    }
                ]
            },
            {
                "key": "s5",
                "title": "Negotiate",
                "stage": 5,
                "overview": "S5_Milestone_Overview__c",
                "items": [
                    {
                        "score": "LegalITReviewCompleted_S5__c",
                        "label": "Legal/IT Review Completed",
                        "reason": "Scoring_Reason_LegalIT_Completed__c"
                    },
                    {
                        "score": "ProcurementAligned_S5__c",
                        "label": "Procurement Aligned",
                        "reason": "Scoring_Reason_Procurement_Aligned__c"
                    }
                ]
            }
        ]
    },
    "organicGrowth": {
        "fields": [
            "Deal_Milestones__c.Stage_0_Complete__c",
            "Deal_Milestones__c.Stage_0_Total__c",
            "Deal_Milestones__c.S0_Health__c",
            "Deal_Milestones__c.Stage_1_Complete__c",
            "Deal_Milestones__c.Stage_1_Total__c",
            "Deal_Milestones__c.S1_Health__c",
            "Deal_Milestones__c.Stage_2_Complete__c",
            "Deal_Milestones__c.Stage_2_Total__c",
            "Deal_Milestones__c.S2_Health__c",
            "Deal_Milestones__c.Stage_3_Complete__c",
            "Deal_Milestones__c.Stage_3_Total__c",
            "Deal_Milestones__c.S3_Health__c",
            "Deal_Milestones__c.Stage_4_Complete__c",
            "Deal_Milestones__c.Stage_4_Total__c",
            "Deal_Milestones__c.S4_Health__c",
            "Deal_Milestones__c.Stage_5_Complete__c",
            "Deal_Milestones__c.Stage_5_Total__c",
            "Deal_Milestones__c.S5_Health__c",
            "Deal_Milestones__c.Usage_Review_Score__c",
            "Deal_Milestones__c.Usage_Review_Reason__c",
            "Deal_Milestones__c.CSM_Risk_Review_Score__c",
            "Deal_Milestones__c.CSM_Risk_Review_Reason__c",
            "Deal_Milestones__c.Use_Case_Identified_Score__c",
            "Deal_Milestones__c.Use_Case_Identified_Reason__c",
            "Deal_Milestones__c.Use_Case_Goal_Score__c",
            "Deal_Milestones__c.Use_Case_Goal_Reason__c",
            "Deal_Milestones__c.Use_Case_Doc_Score__c",
            "Deal_Milestones__c.Use_Case_Doc_Reason__c",
            "Deal_Milestones__c.Discovery_Completed_Score__c",
            "Deal_Milestones__c.Discovery_Completed_Reason__c",
            "Deal_Milestones__c.Overage_Driver_Score__c",
            "Deal_Milestones__c.Overage_Driver_Reason__c",
            "Deal_Milestones__c.Overage_Confirmed_Score__c",
            "Deal_Milestones__c.Overage_Confirmed_Reason__c",
            "Deal_Milestones__c.Volumes_Validated_Score__c",
            "Deal_Milestones__c.Volumes_Validated_Reason__c",
            "Deal_Milestones__c.Growth_Driver_Identified_Score__c",
            "Deal_Milestones__c.Growth_Driver_Identified_Reason__c",
            "Deal_Milestones__c.Proposal_Created_Score__c",
            "Deal_Milestones__c.Proposal_Created_Reason__c",
            "Deal_Milestones__c.Internal_Alignment_Score__c",
            "Deal_Milestones__c.Internal_Alignment_Reason__c",
            "Deal_Milestones__c.CAM_CSM_Alignment_Score__c",
            "Deal_Milestones__c.CAM_CSM_Alignment_Reason__c",
            "Deal_Milestones__c.DocuSign_Sent_Score__c",
            "Deal_Milestones__c.DocuSign_Sent_Reason__c"
        ],
        "groups": [
            {
                "key": "adopt-and-consume",
                "title": "Adopt and consume",
                "items": [
                    {
                        "score": "Usage_Review_Score__c",
                        "label": "Usage Review",
                        "max": 3,
                        "reason": "Usage_Review_Reason__c"
                    },
                    {
                        "score": "CSM_Risk_Review_Score__c",
                        "label": "CSM Risk Review",
                        "max": 3,
                        "reason": "CSM_Risk_Review_Reason__c"
                    },
                    {
                        "score": "Use_Case_Identified_Score__c",
                        "label": "Use Case Identified",
                        "max": 3,
                        "reason": "Use_Case_Identified_Reason__c"
                    },
                    {
                        "score": "Use_Case_Goal_Score__c",
                        "label": "Use Case Goal",
                        "max": 3,
                        "reason": "Use_Case_Goal_Reason__c"
                    },
                    {
                        "score": "Use_Case_Doc_Score__c",
                        "label": "Use Case Doc",
                        "max": 3,
                        "reason": "Use_Case_Doc_Reason__c"
                    }
                ]
            },
            {
                "key": "expand",
                "title": "Expand",
                "items": [
                    {
                        "score": "Discovery_Completed_Score__c",
                        "label": "Discovery Completed",
                        "max": 3,
                        "reason": "Discovery_Completed_Reason__c"
                    },
                    {
                        "score": "Overage_Driver_Score__c",
                        "label": "Overage Driver",
                        "max": 3,
                        "reason": "Overage_Driver_Reason__c"
                    },
                    {
                        "score": "Overage_Confirmed_Score__c",
                        "label": "Overage Confirmed",
                        "max": 3,
                        "reason": "Overage_Confirmed_Reason__c"
                    },
                    {
                        "score": "Volumes_Validated_Score__c",
                        "label": "Volumes Validated",
                        "max": 3,
                        "reason": "Volumes_Validated_Reason__c"
                    },
                    {
                        "score": "Growth_Driver_Identified_Score__c",
                        "label": "Growth Driver Identified",
                        "max": 3,
                        "reason": "Growth_Driver_Identified_Reason__c"
                    }
                ]
            },
            {
                "key": "close",
                "title": "Close",
                "items": [
                    {
                        "score": "Proposal_Created_Score__c",
                        "label": "Proposal Created",
                        "max": 3,
                        "reason": "Proposal_Created_Reason__c"
                    },
                    {
                        "score": "Internal_Alignment_Score__c",
                        "label": "Internal Alignment",
                        "max": 3,
                        "reason": "Internal_Alignment_Reason__c"
                    },
                    {
                        "score": "CAM_CSM_Alignment_Score__c",
                        "label": "CAM CSM Alignment",
                        "max": 3,
                        "reason": "CAM_CSM_Alignment_Reason__c"
                    },
                    {
                        "score": "DocuSign_Sent_Score__c",
                        "label": "DocuSign Sent",
                        "max": 3,
                        "reason": "DocuSign_Sent_Reason__c"
                    }
                ]
            }
        ]
    },
    "newProduct": {
        "fields": [
            "Deal_Milestones__c.Stage_0_Complete__c",
            "Deal_Milestones__c.Stage_0_Total__c",
            "Deal_Milestones__c.S0_Health__c",
            "Deal_Milestones__c.Stage_1_Complete__c",
            "Deal_Milestones__c.Stage_1_Total__c",
            "Deal_Milestones__c.S1_Health__c",
            "Deal_Milestones__c.Stage_2_Complete__c",
            "Deal_Milestones__c.Stage_2_Total__c",
            "Deal_Milestones__c.S2_Health__c",
            "Deal_Milestones__c.Stage_3_Complete__c",
            "Deal_Milestones__c.Stage_3_Total__c",
            "Deal_Milestones__c.S3_Health__c",
            "Deal_Milestones__c.Stage_4_Complete__c",
            "Deal_Milestones__c.Stage_4_Total__c",
            "Deal_Milestones__c.S4_Health__c",
            "Deal_Milestones__c.Stage_5_Complete__c",
            "Deal_Milestones__c.Stage_5_Total__c",
            "Deal_Milestones__c.S5_Health__c",
            "Deal_Milestones__c.PH_Overage_Applies__c",
            "Deal_Milestones__c.Use_Case_Identified_Score__c",
            "Deal_Milestones__c.Use_Case_Identified_Reason__c",
            "Deal_Milestones__c.Use_Case_Goal_Score__c",
            "Deal_Milestones__c.Use_Case_Goal_Reason__c",
            "Deal_Milestones__c.Stakeholders_Champion_Identified_Score__c",
            "Deal_Milestones__c.Stakeholders_Champion_Identified_Reason__c",
            "Deal_Milestones__c.Solution_Validated_Demo_Delivered_Score__c",
            "Deal_Milestones__c.Solution_Validated_Demo_Delivered_Reason__c",
            "Deal_Milestones__c.TechnicalFitScore_S3__c",
            "Deal_Milestones__c.ScoringReason_TechnicalFit_S3__c",
            "Deal_Milestones__c.Discovery_Completed_Score__c",
            "Deal_Milestones__c.Discovery_Completed_Reason__c",
            "Deal_Milestones__c.Overage_Driver_Score__c",
            "Deal_Milestones__c.Overage_Driver_Reason__c",
            "Deal_Milestones__c.Overage_Confirmed_Score__c",
            "Deal_Milestones__c.Overage_Confirmed_Reason__c",
            "Deal_Milestones__c.Volumes_Validated_Score__c",
            "Deal_Milestones__c.Volumes_Validated_Reason__c",
            "Deal_Milestones__c.Proposal_Created_Score__c",
            "Deal_Milestones__c.Proposal_Created_Reason__c",
            "Deal_Milestones__c.Internal_Alignment_Score__c",
            "Deal_Milestones__c.Internal_Alignment_Reason__c",
            "Deal_Milestones__c.CAM_CSM_Alignment_Score__c",
            "Deal_Milestones__c.CAM_CSM_Alignment_Reason__c",
            "Deal_Milestones__c.DocuSign_Sent_Score__c",
            "Deal_Milestones__c.DocuSign_Sent_Reason__c"
        ],
        "groups": [
            {
                "key": "expand",
                "title": "Expand",
                "items": [
                    {
                        "score": "Use_Case_Identified_Score__c",
                        "label": "Use Case Identified",
                        "max": 3,
                        "reason": "Use_Case_Identified_Reason__c"
                    },
                    {
                        "score": "Use_Case_Goal_Score__c",
                        "label": "Use Case Tied to Business Goal",
                        "max": 3,
                        "reason": "Use_Case_Goal_Reason__c"
                    },
                    {
                        "score": "Discovery_Completed_Score__c",
                        "label": "Discovery Completed",
                        "max": 3,
                        "reason": "Discovery_Completed_Reason__c"
                    },
                    {
                        "score": "Overage_Driver_Score__c",
                        "label": "Overage Driver",
                        "max": 3,
                        "reason": "Overage_Driver_Reason__c",
                        "when": "PH_Overage_Applies__c"
                    },
                    {
                        "score": "Overage_Confirmed_Score__c",
                        "label": "Overage Confirmed",
                        "max": 3,
                        "reason": "Overage_Confirmed_Reason__c",
                        "when": "PH_Overage_Applies__c"
                    },
                    {
                        "score": "Volumes_Validated_Score__c",
                        "label": "Volumes Validated",
                        "max": 3,
                        "reason": "Volumes_Validated_Reason__c"
                    },
                    {
                        "score": "Stakeholders_Champion_Identified_Score__c",
                        "label": "Stakeholders & Champion Identified",
                        "max": 3,
                        "reason": "Stakeholders_Champion_Identified_Reason__c"
                    }
                ]
            },
            {
                "key": "close",
                "title": "Close",
                "items": [
                    {
                        "score": "Solution_Validated_Demo_Delivered_Score__c",
                        "label": "Solution Validated / Demo Delivered",
                        "max": 3,
                        "reason": "Solution_Validated_Demo_Delivered_Reason__c"
                    },
                    {
                        "score": "TechnicalFitScore_S3__c",
                        "label": "Technical Fit",
                        "max": 5,
                        "reason": "ScoringReason_TechnicalFit_S3__c",
                        "doneAt": 4
                    },
                    {
                        "score": "Proposal_Created_Score__c",
                        "label": "Proposal Created",
                        "max": 3,
                        "reason": "Proposal_Created_Reason__c"
                    },
                    {
                        "score": "Internal_Alignment_Score__c",
                        "label": "Internal Alignment",
                        "max": 3,
                        "reason": "Internal_Alignment_Reason__c"
                    },
                    {
                        "score": "CAM_CSM_Alignment_Score__c",
                        "label": "CAM CSM Alignment",
                        "max": 3,
                        "reason": "CAM_CSM_Alignment_Reason__c"
                    },
                    {
                        "score": "DocuSign_Sent_Score__c",
                        "label": "DocuSign Sent",
                        "max": 3,
                        "reason": "DocuSign_Sent_Reason__c"
                    }
                ]
            }
        ]
    },
    "renewal": {
        "fields": [
            "Deal_Milestones__c.Stage_0_Complete__c",
            "Deal_Milestones__c.Stage_0_Total__c",
            "Deal_Milestones__c.S0_Health__c",
            "Deal_Milestones__c.Stage_1_Complete__c",
            "Deal_Milestones__c.Stage_1_Total__c",
            "Deal_Milestones__c.S1_Health__c",
            "Deal_Milestones__c.Stage_2_Complete__c",
            "Deal_Milestones__c.Stage_2_Total__c",
            "Deal_Milestones__c.S2_Health__c",
            "Deal_Milestones__c.Stage_3_Complete__c",
            "Deal_Milestones__c.Stage_3_Total__c",
            "Deal_Milestones__c.S3_Health__c",
            "Deal_Milestones__c.Stage_4_Complete__c",
            "Deal_Milestones__c.Stage_4_Total__c",
            "Deal_Milestones__c.S4_Health__c",
            "Deal_Milestones__c.Stage_5_Complete__c",
            "Deal_Milestones__c.Stage_5_Total__c",
            "Deal_Milestones__c.S5_Health__c",
            "Deal_Milestones__c.Usage_Review_Score__c",
            "Deal_Milestones__c.Usage_Review_Reason__c",
            "Deal_Milestones__c.CSM_Risk_Review_Score__c",
            "Deal_Milestones__c.CSM_Risk_Review_Reason__c",
            "Deal_Milestones__c.Use_Case_Identified_Score__c",
            "Deal_Milestones__c.Use_Case_Identified_Reason__c",
            "Deal_Milestones__c.Use_Case_Goal_Score__c",
            "Deal_Milestones__c.Use_Case_Goal_Reason__c",
            "Deal_Milestones__c.Use_Case_Doc_Score__c",
            "Deal_Milestones__c.Use_Case_Doc_Reason__c",
            "Deal_Milestones__c.Discovery_Completed_Score__c",
            "Deal_Milestones__c.Discovery_Completed_Reason__c",
            "Deal_Milestones__c.Overage_Driver_Score__c",
            "Deal_Milestones__c.Overage_Driver_Reason__c",
            "Deal_Milestones__c.Overage_Confirmed_Score__c",
            "Deal_Milestones__c.Overage_Confirmed_Reason__c",
            "Deal_Milestones__c.Volumes_Validated_Score__c",
            "Deal_Milestones__c.Volumes_Validated_Reason__c",
            "Deal_Milestones__c.Growth_Driver_Identified_Score__c",
            "Deal_Milestones__c.Growth_Driver_Identified_Reason__c",
            "Deal_Milestones__c.Proposal_Created_Score__c",
            "Deal_Milestones__c.Proposal_Created_Reason__c",
            "Deal_Milestones__c.Internal_Alignment_Score__c",
            "Deal_Milestones__c.Internal_Alignment_Reason__c",
            "Deal_Milestones__c.CAM_CSM_Alignment_Score__c",
            "Deal_Milestones__c.CAM_CSM_Alignment_Reason__c",
            "Deal_Milestones__c.DocuSign_Sent_Score__c",
            "Deal_Milestones__c.DocuSign_Sent_Reason__c",
            "Deal_Milestones__c.Stakeholders_Confirmed_Score__c",
            "Deal_Milestones__c.Stakeholders_Confirmed_Reason__c"
        ],
        "groups": [
            {
                "key": "adopt-and-consume",
                "title": "Adopt and consume",
                "items": [
                    {
                        "score": "Usage_Review_Score__c",
                        "label": "Usage Review",
                        "max": 3,
                        "reason": "Usage_Review_Reason__c"
                    },
                    {
                        "score": "CSM_Risk_Review_Score__c",
                        "label": "CSM Risk Review",
                        "max": 3,
                        "reason": "CSM_Risk_Review_Reason__c"
                    },
                    {
                        "score": "Use_Case_Identified_Score__c",
                        "label": "Use Case Identified",
                        "max": 3,
                        "reason": "Use_Case_Identified_Reason__c"
                    },
                    {
                        "score": "Use_Case_Goal_Score__c",
                        "label": "Use Case Goal",
                        "max": 3,
                        "reason": "Use_Case_Goal_Reason__c"
                    },
                    {
                        "score": "Use_Case_Doc_Score__c",
                        "label": "Use Case Doc",
                        "max": 3,
                        "reason": "Use_Case_Doc_Reason__c"
                    }
                ]
            },
            {
                "key": "expand",
                "title": "Expand",
                "items": [
                    {
                        "score": "Discovery_Completed_Score__c",
                        "label": "Discovery Completed",
                        "max": 3,
                        "reason": "Discovery_Completed_Reason__c"
                    },
                    {
                        "score": "Overage_Driver_Score__c",
                        "label": "Overage Driver",
                        "max": 3,
                        "reason": "Overage_Driver_Reason__c"
                    },
                    {
                        "score": "Overage_Confirmed_Score__c",
                        "label": "Overage Confirmed",
                        "max": 3,
                        "reason": "Overage_Confirmed_Reason__c"
                    },
                    {
                        "score": "Volumes_Validated_Score__c",
                        "label": "Volumes Validated",
                        "max": 3,
                        "reason": "Volumes_Validated_Reason__c"
                    },
                    {
                        "score": "Growth_Driver_Identified_Score__c",
                        "label": "Growth Driver Identified",
                        "max": 3,
                        "reason": "Growth_Driver_Identified_Reason__c"
                    }
                ]
            },
            {
                "key": "close",
                "title": "Close",
                "items": [
                    {
                        "score": "Proposal_Created_Score__c",
                        "label": "Proposal Created",
                        "max": 3,
                        "reason": "Proposal_Created_Reason__c"
                    },
                    {
                        "score": "Internal_Alignment_Score__c",
                        "label": "Internal Alignment",
                        "max": 3,
                        "reason": "Internal_Alignment_Reason__c"
                    },
                    {
                        "score": "CAM_CSM_Alignment_Score__c",
                        "label": "CAM CSM Alignment",
                        "max": 3,
                        "reason": "CAM_CSM_Alignment_Reason__c"
                    },
                    {
                        "score": "DocuSign_Sent_Score__c",
                        "label": "DocuSign Sent",
                        "max": 3,
                        "reason": "DocuSign_Sent_Reason__c"
                    },
                    {
                        "score": "Stakeholders_Confirmed_Score__c",
                        "label": "Stakeholders Confirmed",
                        "max": 3,
                        "reason": "Stakeholders_Confirmed_Reason__c"
                    }
                ]
            }
        ]
    }
};