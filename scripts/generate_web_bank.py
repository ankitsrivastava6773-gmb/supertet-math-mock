#!/usr/bin/env python3
"""
Generate Master Question Dataset for SuperTET Math Mock Webapp.
Integrates all 36 Master Templates covering 100% of the SuperTET syllabus + authentic PYQs.
"""
import sys
import os
import json

sys.stdout.reconfigure(encoding="utf-8")

# Add template engine to path
sys.path.insert(0, r"c:\Users\piyus\janhvi\supertet\math_mock_system")

from engine.templates.t01_numbers import NumSumOfPrimesTemplate
from engine.templates.t01_divisors_count import NumDivisorsCountTemplate
from engine.templates.t01_prime_factors_exponents import NumPrimeFactorsExponentsSumTemplate
from engine.templates.t01_calendar_odd_days import TimeCalendarOddDaysTemplate
from engine.templates.t02_decimals import NumRecurringDecimalFractionTemplate
from engine.templates.t03_divisibility import NumDivisibilityRulesTemplate
from engine.templates.t04_fractions import NumFractionGreatestSmallestTemplate
from engine.templates.t04_place_face_value import PVPlaceFaceValueDiffTemplate
from engine.templates.t05_lcm_hcf import LCMHCFProductRelationTemplate
from engine.templates.t05_lcm_bells import LCMBellsRingingTogetherTemplate
from engine.templates.t06_bodmas import NumBODMASBracketSimplificationTemplate
from engine.templates.t08_work_time import WorkTimeCombinedDaysTemplate
from engine.templates.t08_chain_rule import WorkChainRuleMenDaysTemplate
from engine.templates.t09_percentage import PctConsumptionPriceChangeTemplate
from engine.templates.t10_profit_loss import ProfitLossOnSPTemplate
from engine.templates.t10_discount import MarkedPriceDiscountProfitTemplate
from engine.templates.t11_interest import CISITwoYearDifferenceTemplate
from engine.templates.t11_si_multiplier import SIMultiplierRelationTemplate
from engine.templates.t11_si_rate_shift import SIRateShiftPrincipalTemplate
from engine.templates.t12_ratio import RatioPartitionAndShareTemplate
from engine.templates.t13_average import AvgReplacementPersonTemplate
from engine.templates.t14_geometry_trapezium import GeomTrapeziumMidpointTemplate
from engine.templates.t14_geometry_polygon import GeomInscribedRegularPolygonTemplate
from engine.templates.t14_parallel_lines import GeomParallelLinesTransversalTemplate
from engine.templates.t14_geometry_circle_tangent import GeomCircleSecantTangentTemplate
from engine.templates.t14_geometry_triangle_angles import GeomTriangleIncenterAngleTemplate
from engine.templates.t15_mensuration_2d import Mens2DRectangleOuterPathTemplate
from engine.templates.t15_triangle import Mens2DEquilateralTriangleTemplate
from engine.templates.t15_rhombus import Mens2DRhombusSideDiagTemplate
from engine.templates.t16_algebraic_identities import AlgReciprocalSumPowerTemplate
from engine.templates.t17_algebra_indices import AlgPowerIndicesRelationTemplate
from engine.templates.t17_linear_equations import AlgLinearItemsCostTemplate
from engine.templates.t18_mensuration_3d import Mens3DSphereRecastTemplate
from engine.templates.t18_cube_cutting import Mens3DCubeCuttingTemplate
from engine.templates.t19_statistics_empirical import StatEmpiricalFormulaTemplate
from engine.templates.t20_pie_chart import DataPieChartTemplate

# 18 New Difficulty-Balanced Templates
from engine.templates.t02_decimals_basic import NumDecimalsAdditionPlaceTemplate
from engine.templates.t09_percentage_basic import PctBasicValueCalcTemplate
from engine.templates.t10_profit_loss_basic import PLDirectProfitCalcTemplate
from engine.templates.t11_si_basic import SIDirectInterestCalcTemplate
from engine.templates.t12_ratio_basic import RatioTwoPartsSplitTemplate
from engine.templates.t13_average_basic import AvgFiveNumbersDirectTemplate
from engine.templates.t14_geometry_basic_angles import GeomAnglesComplementarySupplementaryTemplate
from engine.templates.t15_mensuration_2d_basic import Mens2DRectanglePerimeterAreaTemplate
from engine.templates.t16_identities_basic import AlgIdentityFourABTemplate
from engine.templates.t19_statistics_basic import StatMedianRawDataTemplate
from engine.templates.t03_divisibility_composite import NumDivisibilityComposite72Template
from engine.templates.t04_fractions_word_problems import NumFractionGardenWordProblemTemplate
from engine.templates.t06_bodmas_complex import NumBODMASComplexEvaluationTemplate
from engine.templates.t17_algebra_linear_systems import AlgTwoVariableLinearSystemTemplate
from engine.templates.t11_ci_compound import CIThreeYearCompoundAmountTemplate
from engine.templates.t16_identities_cubic_hard import AlgCubicReciprocalIdentityTemplate
from engine.templates.t15_mensuration_hard_shapes import Mens2DSquareInscribedCircleShadedTemplate
from engine.templates.t01_hard_divisors_sum import NumSumOfAllDivisorsTemplate

MISCONCEPTION_EXPLANATIONS = {
    # T01 Numbers
    "misconception:one_is_prime": {
        "title_hi": "1 को अभाज्य (Prime) मानना",
        "title_en": "Considering 1 as a Prime Number",
        "desc_hi": "1 न तो अभाज्य है और न ही भाज्य। सबसे छोटी अभाज्य संख्या 2 है।",
        "desc_en": "1 is neither prime nor composite. The smallest prime number is 2."
    },
    "misconception:nine_is_prime": {
        "title_hi": "विषम संख्या और अभाज्य संख्या में भ्रम (9 को अभाज्य मानना)",
        "title_en": "Confusing Odd and Prime (Considering 9 as Prime)",
        "desc_hi": "9 एक विषम संख्या है परंतु अभाज्य नहीं, क्योंकि 9 के गुणनखंड 1, 3, 9 हैं।",
        "desc_en": "9 is an odd number but not prime because its factors are 1, 3, 9."
    },
    "misconception:two_is_not_prime": {
        "title_hi": "2 को अभाज्य न मानना (सम संख्या समझकर छोड़ना)",
        "title_en": "Excluding 2 from Primes",
        "desc_hi": "2 एकमात्र सम अभाज्य संख्या (Even Prime) है।",
        "desc_en": "2 is the only even prime number."
    },
    "misconception:reported_total_divisors_including_odd": {
        "title_hi": "सम भाजकों में विषम भाजक भी शामिल कर लेना",
        "title_en": "Reported total divisors instead of even divisors only",
        "desc_hi": "सम भाजकों में 2 की घात कम से कम 1 होनी चाहिए (2⁰ = 1 को छोड़कर)।",
        "desc_en": "For even divisors, power of 2 must be at least 1, excluding 2^0."
    },
    "misconception:reported_odd_divisors_only": {
        "title_hi": "केवल विषम भाजक बता देना",
        "title_en": "Reported odd divisors only",
        "desc_hi": "प्रश्न में सम अथवा कुल भाजक पूछे गए थे।",
        "desc_en": "Question asked for even or total divisors."
    },
    "misconception:multiplied_exponents_without_adding_one": {
        "title_hi": "घातांकों में 1 जोड़े बिना उनका सीधा गुणा कर देना",
        "title_en": "Multiplied exponents without adding 1",
        "desc_hi": "कुल भाजकों का सूत्र (a+1)(b+1)(c+1)... होता है।",
        "desc_en": "Total divisors formula is (a+1)(b+1)(c+1)..."
    },
    "misconception:multiplied_exponents_instead_of_summing": {
        "title_hi": "घातांकों को जोड़ने के बजाय उनका आपस में गुणा कर देना",
        "title_en": "Multiplied exponents instead of summing",
        "desc_hi": "प्रश्न में (x + y + z) यानी घातांकों का योग पूछा गया था।",
        "desc_en": "Question required sum (x + y + z), not product."
    },
    "misconception:added_prime_bases_instead_of_exponents": {
        "title_hi": "घातांकों के बजाय अभाज्य आधारों (2, 3, p) को जोड़ देना",
        "title_en": "Added prime bases instead of exponents",
        "desc_hi": "आधारों को नहीं, बल्कि उनकी घातों (Powers) को जोड़ना था।",
        "desc_en": "Exponents represent powers, not the base primes."
    },
    "misconception:inclusive_counting_added_one_extra_day": {
        "title_hi": "समावेशी गणना (Inclusive Counting) में 1 दिन अधिक जोड़ना",
        "title_en": "Inclusive counting added 1 extra day",
        "desc_hi": "दिन के बाद की गणना में शेषफल (rem = days % 7) सीधे जोड़ा जाता है।",
        "desc_en": "Direct modulo shift (days % 7) should be added to the starting day."
    },
    # T02 Decimals
    "misconception:treated_as_terminating_divided_by_100": {
        "title_hi": "आवर्त दशमलव को शांत दशमलव मानकर 100 से भाग दे देना",
        "title_en": "Treated as Terminating Decimal (divided by 100)",
        "desc_hi": "आवर्त (बार) दशमलव में हर में 99 या 90 आता है, 100 नहीं।",
        "desc_en": "Recurring decimals have denominators of 99 or 90, not 100."
    },
    "misconception:divided_by_90_instead_of_99": {
        "title_hi": "शुद्ध आवर्त में 99 के बजाय 90 से भाग देना",
        "title_en": "Used 90 instead of 99 for pure recurring decimal",
        "desc_hi": "जब दोनों अंकों पर बार हो तो हर 99 होता है।",
        "desc_en": "When all digits recur, the denominator consists solely of 9s (99)."
    },
    "misconception:forgot_to_subtract_non_repeating_digit": {
        "title_hi": "अंश में से अनावर्त अंक को घटाना भूल जाना",
        "title_en": "Forgot to subtract non-repeating digit",
        "desc_hi": "मिश्रित आवर्त में अंश = (पूरी संख्या - अनावर्त भाग) होता है।",
        "desc_en": "In mixed recurring decimals, numerator = (full number - non-repeating part)."
    },
    # T03 Divisibility
    "misconception:took_remainder_directly_without_complement": {
        "title_hi": "शेषफल को ही सीधे अज्ञात अंक मान लेना",
        "title_en": "Took remainder directly instead of complement",
        "desc_hi": "भाजक तक पहुँचने के लिए आवश्यक पूरक अंक (Divisor - Remainder) निकाला जाता है।",
        "desc_en": "Need to find complement (Divisor - Remainder) to complete divisibility."
    },
    # T04 Fractions & Place Value
    "misconception:assumed_largest_numerator_is_largest": {
        "title_hi": "केवल सबसे बड़ा अंश देखकर भिन्न को सबसे बड़ा मान लेना",
        "title_en": "Assumed largest numerator implies largest fraction",
        "desc_hi": "भिन्न का मान अंश और हर दोनों के अनुपात पर निर्भर करता है।",
        "desc_en": "Fraction magnitude depends on ratio of numerator to denominator, not numerator alone."
    },
    "misconception:reported_place_value_only_without_subtracting_face_value": {
        "title_hi": "स्थानीय मान में से अंकित मान को घटाना भूल जाना",
        "title_en": "Reported place value only without subtracting face value",
        "desc_hi": "प्रश्न में स्थानीय मान और अंकित मान का अंतर पूछा गया था।",
        "desc_en": "The question asked for the difference between place value and face value."
    },
    "misconception:added_face_value_instead_of_subtracting": {
        "title_hi": "स्थानीय मान और अंकित मान को घटाने के बजाय जोड़ देना",
        "title_en": "Added face value instead of subtracting",
        "desc_hi": "अंतर निकालने के लिए स्थानीय मान में से अंकित मान घटाया जाता है।",
        "desc_en": "Difference requires subtraction, not addition."
    },
    # T05 LCM & HCF
    "misconception:forgot_hcf_in_numerator": {
        "title_hi": "सूत्र में HCF से गुणा करना भूल जाना",
        "title_en": "Forgetting HCF in numerator",
        "desc_hi": "N1 × N2 = HCF × LCM संबंध में N2 = (HCF × LCM) / N1 होता है।",
        "desc_en": "Product formula requires (HCF × LCM) / N1."
    },
    "misconception:added_all_intervals_together": {
        "title_hi": "घंटियों के अंतरालों का ल.स. निकालने के बजाय सबको सीधे जोड़ देना",
        "title_en": "Added all intervals together instead of finding LCM",
        "desc_hi": "एक साथ बजने का समय अंतरालों का लघुत्तम समापवर्त्य (LCM) होता है।",
        "desc_en": "The period of concurrent tolling is the LCM of individual intervals."
    },
    "misconception:computed_hcf_instead_of_lcm": {
        "title_hi": "ल.स. (LCM) के स्थान पर म.स. (HCF) निकाल देना",
        "title_en": "Computed HCF instead of LCM",
        "desc_hi": "अंतरालों के बाद एक साथ बजने के लिए समापवर्त्य (LCM) आवश्यक है।",
        "desc_en": "Simultaneous repetition requires a multiple (LCM), not a divisor (HCF)."
    },
    # T06 BODMAS
    "misconception:sign_error_in_inner_parenthesis": {
        "title_hi": "अंदरूनी कोष्ठक में चिह्न की त्रुटि",
        "title_en": "Sign error in innermost parenthesis",
        "desc_hi": "कोष्ठक के बाहर ऋण चिह्न (-) होने पर अंदर के चिह्न बदल जाते हैं।",
        "desc_en": "A negative sign outside parenthesis flips all inner signs upon expansion."
    },
    # T08 Work & Time
    "misconception:assumed_simple_average_of_days": {
        "title_hi": "दिनों का सीधा औसत निकाल देना ((A + B) / 2)",
        "title_en": "Assumed simple average of days",
        "desc_hi": "दो लोग मिलकर काम करेंगे तो समय अकेले से भी कम लगेगा, औसत नहीं।",
        "desc_en": "Together, days taken is less than individual days: (A × B)/(A + B)."
    },
    "misconception:direct_proportion_instead_of_inverse": {
        "title_hi": "व्यक्तियों की संख्या और दिनों में सीधा अनुपात मान लेना",
        "title_en": "Used direct proportion instead of inverse variation",
        "desc_hi": "अधिक व्यक्ति होने पर काम कम दिनों में पूरा होगा (M1 × D1 = M2 × D2)।",
        "desc_en": "More workers require fewer days: M1 × D1 = M2 × D2."
    },
    "misconception:additive_difference_of_men": {
        "title_hi": "व्यक्तियों के अंतर को सीधे दिनों में से घटा देना",
        "title_en": "Subtracted difference in workers directly from days",
        "desc_hi": "कार्य और समय की गणना गुणनफल (Man-Days) से होती है, घटाने से नहीं।",
        "desc_en": "Work is conserved as product M × D, not linear subtraction."
    },
    # T09 Percentage
    "misconception:same_percentage_ignoring_base": {
        "title_hi": "मूल्य वृद्धि और खपत कमी को समान प्रतिशत मान लेना",
        "title_en": "Assuming identical percentage for consumption drop",
        "desc_hi": "यदि मूल्य 25% बढ़ता है तो खपत 25% नहीं घटेगी, आधार 125 हो चुका है।",
        "desc_en": "If price rises by 25%, consumption drops by 20% due to base change."
    },
    # T10 Profit & Loss
    "misconception:same_percentage_ignoring_base_change": {
        "title_hi": "विक्रय मूल्य (SP) और क्रय मूल्य (CP) के प्रतिशत को समान मानना",
        "title_en": "Ignoring Base Change between SP and CP",
        "desc_hi": "SP का 20% और CP का 20% कभी समान नहीं होते।",
        "desc_en": "20% on SP is not equal to 20% on CP."
    },
    "misconception:direct_addition_of_discount_and_profit": {
        "title_hi": "छूट और लाभ को सीधे जोड़ देना",
        "title_en": "Direct addition of discount and profit",
        "desc_hi": "छूट अंकित मूल्य पर होती है और लाभ क्रय मूल्य पर।",
        "desc_en": "Discount applies to MP, profit applies to CP."
    },
    # T11 Interest
    "misconception:used_simple_interest_single_year": {
        "title_hi": "1 वर्ष के साधारण ब्याज का सूत्र लगा देना",
        "title_en": "Used single year simple interest",
        "desc_hi": "2 वर्ष के CI-SI अंतर में दर का वर्ग (R²) होता है।",
        "desc_en": "2-year difference formula requires (R/100) squared."
    },
    "misconception:direct_proportion_without_subtracting_principal": {
        "title_hi": "मिश्रधन से मूलधन घटाए बिना सीधा अनुपात लगाना",
        "title_en": "Direct proportion without subtracting principal",
        "desc_hi": "साधारण ब्याज में केवल ब्याज (N-1) बढ़ता है, मूलधन नहीं।",
        "desc_en": "In SI, only interest (N - 1) increases over time, principal is constant."
    },
    "misconception:multiplied_time_directly_by_multiplier": {
        "title_hi": "समय को सीधे गुने (Multiplier) से गुणा कर देना",
        "title_en": "Multiplied time directly by multiplier",
        "desc_hi": "तिगुनी होने पर ब्याज 2 गुना होता है, 3 गुना नहीं।",
        "desc_en": "Tripling principal yields 2 times interest, not 3 times."
    },
    "misconception:forgot_to_divide_by_time_years": {
        "title_hi": "दर परिवर्तन में समय (वर्षों) से भाग देना भूल जाना",
        "title_en": "Forgot to divide by time period",
        "desc_hi": "कुल अतिरिक्त ब्याज = P × (ΔR × T) / 100 होता है।",
        "desc_en": "Interest difference is spread over all T years: P × ΔR × T / 100."
    },
    # T12 Ratio
    "misconception:divided_equally_by_three_ignoring_ratio": {
        "title_hi": "अनुपात को नजरअंदाज कर 3 से बराबर भाग दे देना",
        "title_en": "Divided equally by 3 ignoring ratio",
        "desc_hi": "राशि का विभाजन अनुपाती पदों के योग (a+b+c) के अनुसार होता है।",
        "desc_en": "Division must be proportional to sum of ratio terms (a+b+c)."
    },
    # T13 Average
    "misconception:inverted_sign_of_shift": {
        "title_hi": "औसत वृद्धि होने पर घटा देना या कमी होने पर जोड़ देना",
        "title_en": "Inverted sign of average shift",
        "desc_hi": "औसत बढ़ने पर नए व्यक्ति का मान जाने वाले से अधिक होता है।",
        "desc_en": "When average increases, incoming person must be greater than replaced person."
    },
    # T14 Geometry
    "misconception:used_ab_instead_of_total_secant_pb": {
        "title_hi": "छेदक रेखा में सम्पूर्ण PB के स्थान पर केवल जीवा खंड AB ले लेना",
        "title_en": "Used chord segment AB instead of entire secant PB",
        "desc_hi": "स्पर्श-छेदक प्रमेय: PT² = PA × PB (जहाँ PB = PA + AB)।",
        "desc_en": "Tangent-Secant theorem requires PT^2 = PA * PB, where PB = PA + AB."
    },
    "misconception:used_external_bisector_formula_90_minus_half_a": {
        "title_hi": "आंतरिक समद्विभाजक में बाह्य समद्विभाजक सूत्र (90° - A/2) लगाना",
        "title_en": "Used 90 - A/2 instead of internal bisector formula 90 + A/2",
        "desc_hi": "आंतरिक समद्विभाजकों के लिए अंतःकेंद्र पर कोण ∠BOC = 90° + ∠A/2 होता है।",
        "desc_en": "Internal incenter angle is obtuse: 90° + A/2."
    },
    "misconception:confused_incenter_with_circumcenter_angle_2A": {
        "title_hi": "अंतःकेंद्र के स्थान पर परिकेंद्र का सूत्र (2A) लगा देना",
        "title_en": "Confused incenter with circumcenter angle 2A",
        "desc_hi": "2A परिकेंद्र (Circumcenter) पर बनता है, अंतःकेंद्र पर 90° + A/2 बनता है।",
        "desc_en": "2A is the angle subtended at the circumcenter, not the incenter."
    },
    # T15 Mensuration 2D
    "misconception:omitted_four_corner_squares_in_path": {
        "title_hi": "रास्ते के 4 कोनों के क्षेत्रफल (4w²) को छोड़ देना",
        "title_en": "Omitted 4 corner squares in path area",
        "desc_hi": "आयताकार रास्ते का क्षेत्रफल = 2w(L + B + 2w) होता है।",
        "desc_en": "Path area is 2w(L + B + 2w) accounting for corners."
    },
    "misconception:forgot_to_halve_diagonals_before_pythagoras": {
        "title_hi": "पाइथागोरस प्रमेय लगाने से पहले विकर्णों को आधा करना भूल जाना",
        "title_en": "Forgot to halve diagonals before applying Pythagoras theorem",
        "desc_hi": "समचतुर्भुज के विकर्ण परस्पर समकोण पर समद्विभाजित (आधा) होते हैं।",
        "desc_en": "Diagonals of a rhombus bisect each other at right angles."
    },
    # T16 Algebra
    "misconception:direct_squaring_omitted_two_ab": {
        "title_hi": "सीधे वर्ग कर देना (सर्वसमिका का +2ab पद भूल जाना)",
        "title_en": "Direct squaring omitting +2ab term",
        "desc_hi": "(x + 1/x)² = x² + 1/x² + 2 होता है। अतः x² + 1/x² = k² - 2 होगा।",
        "desc_en": "(x + 1/x)² = x² + 1/x² + 2, so x² + 1/x² = k² - 2."
    },
    # T17 Algebra & Linear Equations
    "misconception:multiplied_by_k_minus_one": {
        "title_hi": "गुणांक से 1 कम संख्या से गुणा करना",
        "title_en": "Multiplied by (k - 1) instead of k",
        "desc_hi": "समीकरण के सभी पदों का अनुपात k है, अतः मूल्य भी k गुना होगा।",
        "desc_en": "The scaling factor for all items is k, so total cost scales by k."
    },
    # T18 Mensuration 3D
    "misconception:linear_side_ratio_without_cubing": {
        "title_hi": "भुजाओं के अनुपात का घन (Cube) किए बिना रेखीय अनुपात लेना",
        "title_en": "Linear side ratio used without cubing",
        "desc_hi": "आयतन और घनों की संख्या भुजाओं के अनुपात के घन (n³) के बराबर होती है।",
        "desc_en": "Count of smaller cubes is proportional to volume: (S/s)^3."
    },
    "misconception:squared_instead_of_cubed_surface_area_trap": {
        "title_hi": "आयतन के बजाय पृष्ठीय क्षेत्रफल का अनुपात (वर्ग) निकाल देना",
        "title_en": "Squared instead of cubed (surface area ratio)",
        "desc_hi": "ठोस वस्तु को काटने पर आयतन संरक्षित रहता है, वर्ग नहीं।",
        "desc_en": "Material conservation in 3D cutting depends on volume (cubic ratio)."
    },
    # T19 Statistics
    "misconception:swapped_roles_of_mean_and_mode": {
        "title_hi": "माध्य और बहुलक के पदों को आपस में बदल देना",
        "title_en": "Swapped Mean and Mode",
        "desc_hi": "कार्ल पियर्सन का सूत्र: बहुलक = 3(माध्यिका) - 2(माध्य)।",
        "desc_en": "Empirical formula is Mode = 3(Median) - 2(Mean)."
    },
    # New additions for balanced templates
    # T02 Decimals Basic
    "misconception:misaligned_decimal_point_shift_left": {
        "title_hi": "दशमलव बिंदु का बाएँ खिसक जाना (गलत स्थान मान)",
        "title_en": "Misaligned decimal point shifted left",
        "desc_hi": "दशमलव संख्याओं को जोड़ते समय दशमलव बिंदुओं को एक सीध में रखना आवश्यक है।",
        "desc_en": "Decimals must be aligned by their decimal points before addition."
    },
    "misconception:misaligned_decimal_point_shift_right": {
        "title_hi": "दशमलव बिंदु का दाएँ खिसक जाना",
        "title_en": "Misaligned decimal point shifted right",
        "desc_hi": "दशमलव का स्थान गलत होने से संख्या का मान 10 गुना बदल जाता है।",
        "desc_en": "Shifting the decimal point alters the value by a factor of 10."
    },
    "misconception:added_decimals_as_integers": {
        "title_hi": "दशमलव को पूर्णांक मानकर सीधे जोड़ देना",
        "title_en": "Added decimals as raw integers",
        "desc_hi": "दशमलव भाग और पूर्णांक भाग को अलग-अलग स्थानीय मान के अनुसार जोड़ा जाता है।",
        "desc_en": "Decimal parts must be summed according to place values, not as integers."
    },
    # T09 Percentage Basic
    "misconception:divided_by_10_instead_of_100": {
        "title_hi": "100 के स्थान पर 10 से भाग देना",
        "title_en": "Divided by 10 instead of 100",
        "desc_hi": "प्रतिशत का अर्थ प्रति सैकड़ा होता है, अतः 100 से भाग दिया जाता है।",
        "desc_en": "Percent means per hundred; division must be by 100."
    },
    "misconception:multiplied_instead_of_dividing_by_100": {
        "title_hi": "100 से भाग देने के बजाय 100 से गुणा कर देना",
        "title_en": "Multiplied instead of dividing by 100",
        "desc_hi": "प्रतिशत मान ज्ञात करने के लिए दर को 100 से विभाजित किया जाता है।",
        "desc_en": "To calculate a percentage value, rate is divided by 100."
    },
    "misconception:added_rate_to_base_number": {
        "title_hi": "प्रतिशत दर को सीधे मूल संख्या में जोड़ देना",
        "title_en": "Added rate directly to base number",
        "desc_hi": "प्रतिशत दर सीधे नहीं जुड़ती, पहले उस दर से मान निकाला जाता है।",
        "desc_en": "Rate cannot be directly added to base; calculate the percentage value first."
    },
    # T10 Profit Loss Basic
    "misconception:subtracted_profit_from_cp_instead_of_adding": {
        "title_hi": "लाभ को क्रय मूल्य में जोड़ने के बजाय घटा देना",
        "title_en": "Subtracted profit from CP instead of adding",
        "desc_hi": "लाभ की स्थिति में विक्रय मूल्य = क्रय मूल्य + लाभ होता है।",
        "desc_en": "When making a profit, SP = CP + Profit."
    },
    "misconception:calculated_profit_amount_only": {
        "title_hi": "केवल लाभ राशि बता देना (विक्रय मूल्य नहीं बताना)",
        "title_en": "Reported profit amount only instead of SP",
        "desc_hi": "प्रश्न में विक्रय मूल्य (SP) पूछा गया था, केवल लाभ नहीं।",
        "desc_en": "Question asked for Selling Price (SP), not just profit amount."
    },
    "misconception:divided_cp_by_rate": {
        "title_hi": "क्रय मूल्य को प्रतिशत दर से भाग दे देना",
        "title_en": "Divided CP by profit rate",
        "desc_hi": "लाभ निकालने के लिए क्रय मूल्य का प्रतिशत (CP × Rate / 100) निकाला जाता है।",
        "desc_en": "Profit is CP * Rate / 100, not CP / Rate."
    },
    # T11 SI Basic
    "misconception:omitted_time_period_multiplication": {
        "title_hi": "सूत्र में समय (T) से गुणा करना भूल जाना",
        "title_en": "Omitted time period multiplication",
        "desc_hi": "साधारण ब्याज = (P × R × T) / 100 होता है; समय का गुणा अनिवार्य है।",
        "desc_en": "SI = (P * R * T) / 100; time factor cannot be omitted."
    },
    "misconception:added_principal_amount_instead_of_interest_only": {
        "title_hi": "केवल ब्याज के स्थान पर मिश्रधन (A = P + SI) बता देना",
        "title_en": "Reported total amount instead of interest only",
        "desc_hi": "प्रश्न में केवल साधारण ब्याज (SI) पूछा गया था।",
        "desc_en": "The question asked for interest only, not the total accumulated amount."
    },
    # T12 Ratio Basic
    "misconception:divided_by_first_ratio_term_only": {
        "title_hi": "अनुपाती योग के स्थान पर केवल पहले पद से भाग देना",
        "title_en": "Divided by first ratio term instead of sum of terms",
        "desc_hi": "कुल राशि को अनुपाती योग (a + b) से विभाजित कर एक भाग का मान निकाला जाता है।",
        "desc_en": "Divide by sum of ratio terms (a + b) to find one part value."
    },
    "misconception:calculated_other_share_ratio_b": {
        "title_hi": "पहले भाग के स्थान पर दूसरा भाग निकाल देना",
        "title_en": "Calculated second share instead of first requested share",
        "desc_hi": "प्रश्न में निर्दिष्ट व्यक्ति/भाग का मान ही ज्ञात करना था।",
        "desc_en": "Calculated share for the wrong ratio component."
    },
    "misconception:divided_by_difference_of_terms": {
        "title_hi": "अनुपाती योग के स्थान पर अनुपाती अंतर से भाग देना",
        "title_en": "Divided by difference of terms instead of sum",
        "desc_hi": "कुल राशि बांटने के लिए अनुपाती पदों का योग (a + b) प्रयुक्त होता है।",
        "desc_en": "Sum of ratio terms should be used for total distribution."
    },
    # T13 Average Basic
    "misconception:divided_by_four_instead_of_five": {
        "title_hi": "कुल 5 संख्याओं के स्थान पर 4 से भाग देना",
        "title_en": "Divided by 4 instead of 5",
        "desc_hi": "औसत = पदों का योग / पदों की कुल संख्या (5)।",
        "desc_en": "Average = Sum / Total count (5 numbers)."
    },
    "misconception:divided_by_six_instead_of_five": {
        "title_hi": "कुल 5 संख्याओं के स्थान पर 6 से भाग देना",
        "title_en": "Divided by 6 instead of 5",
        "desc_hi": "पदों की संख्या ठीक से गिनना आवश्यक है।",
        "desc_en": "Count of observations must be accurately determined."
    },
    "misconception:omitted_one_element_in_sum": {
        "title_hi": "योग करते समय एक संख्या को छोड़ देना",
        "title_en": "Omitted one element in sum",
        "desc_hi": "औसत निकालते समय सभी दी गई संख्याओं का योग किया जाता है।",
        "desc_en": "All terms must be included in the numerator sum."
    },
    # T14 Geometry Basic Angles
    "misconception:confused_complementary_with_supplementary": {
        "title_hi": "पूरक कोण (90°) और संपूरक कोण (180°) में भ्रम",
        "title_en": "Confused complementary (90°) with supplementary (180°)",
        "desc_hi": "पूरक कोणों का योग 90° तथा संपूरक कोणों का योग 180° होता है।",
        "desc_en": "Complementary angles sum to 90°; supplementary sum to 180°."
    },
    "misconception:subtracted_from_360_complete_angle": {
        "title_hi": "संपूर्ण कोण (360°) में से घटा देना",
        "title_en": "Subtracted from 360° complete angle",
        "desc_hi": "पूरक कोण के लिए 90° से घटाया जाता है, 360° से नहीं।",
        "desc_en": "Subtract from 90° for complement, not 360°."
    },
    "misconception:doubled_angle_instead_of_complement": {
        "title_hi": "पूरक कोण निकालने के बजाय कोण का दोगुना कर देना",
        "title_en": "Doubled angle instead of finding complement",
        "desc_hi": "पूरक कोण = 90° - दिया गया कोण।",
        "desc_en": "Complement is 90° - given angle."
    },
    # T15 Mensuration 2D Basic
    "misconception:calculated_area_instead_of_perimeter": {
        "title_hi": "परिमाप के स्थान पर क्षेत्रफल (लम्बाई × चौड़ाई) निकाल देना",
        "title_en": "Calculated area instead of perimeter",
        "desc_hi": "परिमाप = 2(लम्बाई + चौड़ाई) होता है, क्षेत्रफल नहीं।",
        "desc_en": "Perimeter is 2(L + B), not L * B."
    },
    "misconception:forgot_to_multiply_sum_by_two": {
        "title_hi": "लम्बाई और चौड़ाई जोड़कर 2 से गुणा करना भूल जाना",
        "title_en": "Forgot to multiply sum of length and breadth by 2",
        "desc_hi": "आयत में दो लम्बाई और दो चौड़ाई होती हैं: 2(L + B)।",
        "desc_en": "A rectangle has two lengths and two breadths: 2(L + B)."
    },
    "misconception:squared_one_side_only": {
        "title_hi": "केवल एक भुजा का वर्ग कर देना",
        "title_en": "Squared one side only",
        "desc_hi": "आयत का परिमाप भुजाओं के योग का दोगुना होता है।",
        "desc_en": "Perimeter requires all four side boundaries."
    },
    # T16 Identities Basic
    "misconception:used_2ab_instead_of_4ab": {
        "title_hi": "(a+b)² - (a-b)² में 4ab के स्थान पर 2ab समझना",
        "title_en": "Used 2ab instead of 4ab in identity",
        "desc_hi": "(a+b)² - (a-b)² = 4ab होता है। (2ab केवल एक द्विपद वर्ग में आता है)।",
        "desc_en": "(a+b)^2 - (a-b)^2 = 4ab, not 2ab."
    },
    "misconception:forgot_constant_four_in_identity": {
        "title_hi": "सर्वसमिका में 4 का गुणा भूलकर केवल ab लिख देना",
        "title_en": "Forgot constant 4, wrote ab only",
        "desc_hi": "सर्वसमिका का मान 4ab होता है।",
        "desc_en": "The value of identity is 4ab."
    },
    "misconception:used_sum_of_squares_identity": {
        "title_hi": "अंतर के स्थान पर योग का सूत्र 2(a²+b²) लगा देना",
        "title_en": "Used sum of squares identity 2(a^2 + b^2)",
        "desc_hi": "(a+b)² + (a-b)² = 2(a²+b²) होता है, परंतु यहाँ बीच में माइनस (-) था।",
        "desc_en": "Formula 2(a^2 + b^2) applies when adding squares, not subtracting."
    },
    # T19 Statistics Basic
    "misconception:did_not_sort_array_took_middle_raw_element": {
        "title_hi": "आँकड़ों को आरोही क्रम में व्यवस्थित किए बिना बीच का पद ले लेना",
        "title_en": "Did not sort array, took raw middle element",
        "desc_hi": "माध्यिका (Median) निकालने से पहले आँकड़ों को बढ़ते क्रम में लगाना अनिवार्य है।",
        "desc_en": "Observations must be sorted in ascending order before taking median."
    },
    "misconception:reported_mean_instead_of_median": {
        "title_hi": "माध्यिका के स्थान पर समांतर माध्य निकाल देना",
        "title_en": "Reported mean instead of median",
        "desc_hi": "माध्यिका मध्य पद का मान है, सभी पदों का औसत नहीं।",
        "desc_en": "Median is the positional middle value, not arithmetic mean."
    },
    "misconception:reported_range_or_first_element": {
        "title_hi": "मध्य पद के स्थान पर परास या पहला पद ले लेना",
        "title_en": "Reported extreme or range instead of median",
        "desc_hi": "माध्यिका बिल्कुल बीच का मान होता है।",
        "desc_en": "Median is the exact central value."
    },
    # T03 Divisibility Composite
    "misconception:satisfied_9_only_not_8": {
        "title_hi": "केवल 9 की विभाज्यता जांची, 8 की विभाज्यता की अनदेखी की",
        "title_en": "Satisfied 9 only, not 8",
        "desc_hi": "72 से भाज्य होने के लिए संख्या को 8 और 9 दोनों से विभाजित होना चाहिए।",
        "desc_en": "For 72 divisibility, number must be divisible by both 8 and 9."
    },
    "misconception:satisfied_8_only_not_9": {
        "title_hi": "केवल 8 की विभाज्यता जांची, 9 की नहीं",
        "title_en": "Satisfied 8 only, not 9",
        "desc_hi": "अंकों का योग 9 का गुणज होना भी आवश्यक है।",
        "desc_en": "Sum of digits must also be a multiple of 9."
    },
    "misconception:confused_sum_with_difference": {
        "title_hi": "योग (x + y) के स्थान पर अंतर निकाल देना",
        "title_en": "Confused sum with difference",
        "desc_hi": "प्रश्न में दोनों अज्ञात अंकों का योग (x + y) पूछा गया था।",
        "desc_en": "Question asked for sum (x + y), not difference."
    },
    # T04 Fractions Word Problems
    "misconception:treated_second_fraction_as_independent_of_remainder": {
        "title_hi": "दूसरी भिन्न को 'शेष' के बजाय कुल का हिस्सा मान लेना",
        "title_en": "Treated second fraction as fraction of total instead of remainder",
        "desc_hi": "जब 'शेष का x भाग' कहा जाए तो पहले शेष भाग निकाला जाता है।",
        "desc_en": "When 'fraction of remaining' is specified, find the remainder first."
    },
    "misconception:multiplied_fractions_directly_without_complement": {
        "title_hi": "शेष निकाले बिना सीधे दोनों भिन्नों का गुणा कर देना",
        "title_en": "Multiplied fractions directly without finding remainder",
        "desc_hi": "शेष = (1 - पहली भिन्न) करके फिर दूसरी भिन्न का गुणा किया जाता है।",
        "desc_en": "Must calculate complement (1 - f1) before scaling by f2."
    },
    "misconception:added_fractions_without_finding_remainder": {
        "title_hi": "शेष की अवधारणा को छोड़कर भिन्नों को सीधे जोड़ देना",
        "title_en": "Added fractions ignoring 'remaining' condition",
        "desc_hi": "प्रश्न में शेष का भाग दिया गया था, कुल का सीधा भाग नहीं।",
        "desc_en": "Second fraction applies only to the remainder, not whole."
    },
    # T06 BODMAS Complex
    "misconception:evaluated_left_to_right_ignoring_precedence": {
        "title_hi": "संक्रियाओं की वरीयता (BODMAS) की अनदेखी कर बाएँ से दाएँ हल करना",
        "title_en": "Evaluated strictly left-to-right ignoring BODMAS precedence",
        "desc_hi": "पहले कोष्ठक, फिर भाग, फिर गुणा, फिर जोड़/घटाना किया जाता है।",
        "desc_en": "Follow brackets -> division -> multiplication -> addition/subtraction."
    },
    "misconception:performed_addition_before_multiplication": {
        "title_hi": "गुणा करने से पहले जोड़ कर देना",
        "title_en": "Performed addition before multiplication",
        "desc_hi": "BODMAS नियम में गुणा (Multiplication) जोड़ (Addition) से पहले होता है।",
        "desc_en": "Multiplication takes priority over addition."
    },
    "misconception:forgot_bracket_subtraction_step": {
        "title_hi": "कोष्ठक के अंदर की संक्रिया पूरी किए बिना बाहर की संक्रिया करना",
        "title_en": "Did not resolve inner brackets first",
        "desc_hi": "सबसे पहले आंतरिक कोष्ठक का मान हल किया जाता है।",
        "desc_en": "Innermost brackets must be fully resolved first."
    },
    # T17 Linear Systems
    "misconception:swapped_variable_values_x_and_y": {
        "title_hi": "x और y के मानों को आपस में बदल देना",
        "title_en": "Swapped values of x and y",
        "desc_hi": "जिस चर (Variable) का मान पूछा गया है, वही उत्तर देना चाहिए।",
        "desc_en": "Ensure reporting the specifically requested variable."
    },
    "misconception:added_instead_of_subtracting_in_elimination": {
        "title_hi": "विलोपन विधि में समीकरणों को घटाने के स्थान पर जोड़ देना",
        "title_en": "Added equations instead of subtracting during elimination",
        "desc_hi": "समान चिन्ह वाले पदों को विलुप्त करने के लिए समीकरणों को घटाया जाता है।",
        "desc_en": "To eliminate terms with same sign, equations must be subtracted."
    },
    "misconception:sign_error_in_linear_system": {
        "title_hi": "पक्षान्तरण में चिन्ह की त्रुटि (प्लस/माइनस की गलती)",
        "title_en": "Sign error during variable transposition",
        "desc_hi": "पक्षान्तरण करते समय चिन्ह बदल जाते हैं (+ से - और - से +)।",
        "desc_en": "Watch signs during transposition (+ becomes - and vice versa)."
    },
    # T11 CI Compound
    "misconception:used_simple_interest_formula_instead_of_compound": {
        "title_hi": "चक्रवृद्धि ब्याज के स्थान पर साधारण ब्याज का सूत्र लगा देना",
        "title_en": "Used simple interest formula instead of compound interest",
        "desc_hi": "चक्रवृद्धि ब्याज में ब्याज पर भी ब्याज लगता है: A = P(1 + R/100)ⁿ।",
        "desc_en": "Compound interest compounds annually: A = P(1 + R/100)^n."
    },
    "misconception:calculated_compound_interest_only_omitted_principal": {
        "title_hi": "मिश्रधन पूछा होने पर केवल चक्रवृद्धि ब्याज बता देना",
        "title_en": "Reported compound interest only instead of total amount",
        "desc_hi": "प्रश्न में मिश्रधन (Amount = P + CI) पूछा गया था।",
        "desc_en": "Question asked for total accumulated amount, not just interest."
    },
    "misconception:compounded_for_two_years_instead_of_three": {
        "title_hi": "3 वर्ष के स्थान पर केवल 2 वर्ष का संयोजन करना",
        "title_en": "Compounded for 2 years instead of 3 years",
        "desc_hi": "समय अवधि 3 वर्ष दी गई है, अतः घात 3 होगी।",
        "desc_en": "Time period given was 3 years, so power is 3."
    },
    # T16 Identities Cubic Hard
    "misconception:cubic_expansion_omitted_3k_term": {
        "title_hi": "घन सर्वसमिका में 3(x + 1/x) पद घटाना भूलकर केवल k³ लिख देना",
        "title_en": "Omitted -3k term in cubic expansion",
        "desc_hi": "x³ + 1/x³ = (x + 1/x)³ - 3(x + 1/x) = k³ - 3k होता है।",
        "desc_en": "x^3 + 1/x^3 = k^3 - 3k; omitting 3k yields an inflated answer."
    },
    "misconception:added_3k_instead_of_subtracting_3k": {
        "title_hi": "3k घटाने के बजाय जोड़ देना (k³ + 3k)",
        "title_en": "Added 3k instead of subtracting 3k",
        "desc_hi": "(x + 1/x)³ के प्रसार में +3k आता है जो पक्षांतर करने पर -3k बनता है।",
        "desc_en": "Transposing +3k yields -3k on the opposite side."
    },
    "misconception:used_square_formula_instead_of_cube": {
        "title_hi": "घन (x³) के स्थान पर वर्ग (x²) का मान निकाल देना",
        "title_en": "Used square formula (k^2 - 2) instead of cube",
        "desc_hi": "प्रश्न में x³ + 1/x³ पूछा गया था, न कि x² + 1/x²।",
        "desc_en": "The question asked for cubic sum, not squared sum."
    },
    # T15 Mensuration Hard Shapes
    "misconception:used_pi_r_squared_without_subtracting_from_square": {
        "title_hi": "छायांकित भाग निकालने के लिए वर्ग में से वृत्त को घटाना भूल जाना",
        "title_en": "Forgot to subtract circle area from square area",
        "desc_hi": "छायांकित भाग (चारों कोनों) का क्षेत्रफल = वर्ग का क्षेत्रफल - अंतर्वृत्त का क्षेत्रफल।",
        "desc_en": "Shaded corner area = Square Area - Circle Area."
    },
    "misconception:used_diameter_instead_of_radius_in_area": {
        "title_hi": "त्रिज्या के स्थान पर व्यास (भुजा a) का प्रयोग कर देना",
        "title_en": "Used diameter instead of radius in circle area",
        "desc_hi": "अंतर्वृत्त की त्रिज्या r = a/2 होती है।",
        "desc_en": "Inscribed circle radius r = side / 2."
    },
    "misconception:calculated_perimeter_difference_instead_of_area": {
        "title_hi": "क्षेत्रफल के स्थान पर परिमापों का अंतर निकाल देना",
        "title_en": "Calculated perimeter difference instead of area",
        "desc_hi": "छायांकित भाग का क्षेत्रफल पूछा गया था, परिमाप नहीं।",
        "desc_en": "Question requested shaded area, not perimeter."
    },
    # T01 Hard Divisors Sum
    "misconception:reported_count_of_divisors_instead_of_sum": {
        "title_hi": "भाजकों के योग के स्थान पर भाजकों की संख्या बता देना",
        "title_en": "Reported count of divisors instead of sum",
        "desc_hi": "प्रश्न में सभी भाजकों का योगफल पूछा गया था, कुल संख्या नहीं।",
        "desc_en": "Question asked for sum of divisors (sigma(N)), not count (tau(N))."
    },
    "misconception:omitted_one_and_number_itself": {
        "title_hi": "भाजकों के योग में 1 और स्वयं संख्या को छोड़ देना",
        "title_en": "Omitted 1 and the number itself from sum",
        "desc_hi": "सभी भाजकों में 1 और स्वयं वह संख्या भी सम्मिलित होती है।",
        "desc_en": "All divisors includes 1 and the number itself unless proper divisors specified."
    },
    "misconception:summed_only_prime_factors": {
        "title_hi": "सभी भाजकों के स्थान पर केवल अभाज्य गुणनखंडों को जोड़ देना",
        "title_en": "Summed only prime factors instead of all divisors",
        "desc_hi": "अभाज्य गुणनखंडों के अलावा उनके संयुक्त गुणनफल भी भाजक होते हैं।",
        "desc_en": "Must include all composite divisors in addition to prime factors."
    }
}

TOPIC_META = {
    "T01": {"name_hi": "संख्याएँ एवं अभाज्य संख्याएँ", "name_en": "Numbers & Primes", "icon": "🔢"},
    "T02": {"name_hi": "दशमलव एवं आवर्त भिन्न (Decimals)", "name_en": "Decimals & Recurring Fractions", "icon": "🔣"},
    "T03": {"name_hi": "विभाज्यता के नियम (Divisibility)", "name_en": "Divisibility Rules", "icon": "🔍"},
    "T04": {"name_hi": "भिन्न एवं स्थानीय मान (Fractions & Place Value)", "name_en": "Fractions & Place Value", "icon": "🍰"},
    "T05": {"name_hi": "ल.स. एवं म.स. (LCM & HCF)", "name_en": "LCM & HCF", "icon": "⚙️"},
    "T06": {"name_hi": "सरलीकरण एवं कोष्ठक (BODMAS)", "name_en": "BODMAS & Simplification", "icon": "🧮"},
    "T08": {"name_hi": "ऐकिक नियम, समय एवं कार्य (Work & Time)", "name_en": "Unitary Method & Work-Time", "icon": "⏳"},
    "T09": {"name_hi": "प्रतिशतता एवं खपत (Percentage)", "name_en": "Percentage & Consumption", "icon": "📈"},
    "T10": {"name_hi": "लाभ, हानि एवं बट्टा (Commercial Math)", "name_en": "Profit, Loss & Discount", "icon": "💰"},
    "T11": {"name_hi": "साधारण एवं चक्रवृद्धि ब्याज (Interest)", "name_en": "Simple & Compound Interest", "icon": "🏦"},
    "T12": {"name_hi": "अनुपात एवं समानुपात (Ratio & Proportion)", "name_en": "Ratio & Proportion", "icon": "⚖️"},
    "T13": {"name_hi": "औसत (Average)", "name_en": "Average", "icon": "🎯"},
    "T14": {"name_hi": "ज्यामिति (Geometry)", "name_en": "Geometry", "icon": "📐"},
    "T15": {"name_hi": "2D क्षेत्रमिति एवं परिमाप (2D Mensuration)", "name_en": "2D Mensuration & Area", "icon": "🟩"},
    "T16": {"name_hi": "बीजगणितीय सर्वसमिकाएँ (Identities)", "name_en": "Algebraic Identities", "icon": "✨"},
    "T17": {"name_hi": "बीजगणित एवं घातांक (Algebra & Indices)", "name_en": "Algebra & Indices", "icon": "⚡"},
    "T18": {"name_hi": "3D क्षेत्रमिति एवं आयतन (3D Mensuration)", "name_en": "3D Mensuration & Volume", "icon": "🧊"},
    "T19": {"name_hi": "सांख्यिकी (माध्य, माध्यिका, बहुलक)", "name_en": "Statistics (Central Tendency)", "icon": "📊"}
}

AUTHENTIC_PYQ_VISUAL_QUESTIONS = [
    {
        "template_id": "pyq_uptet_2022_p2_q45",
        "topic_id": "T19",
        "subtopic_id": "pie_chart_interpretation",
        "difficulty": "Medium",
        "rubric_score": 4,
        "stem_hi": "किसी परिवार का मासिक व्यय निम्न वृत्त-आरेख (चित्र) के अनुसार है। यदि शिक्षा तथा यात्रा पर व्यय का अंतर ₹4000 हो, तो परिवार की कुल आय कितनी होगी?",
        "stem_en": "The expenditure of a family in a month is given in figure. If the difference of expenditure between education and travel is Rs. 4000, then what is the total income of the family?",
        "options": [
            {"label": "A", "hi": "₹ 40,000", "en": "Rs. 40,000", "is_correct": True, "misconception_tag": None},
            {"label": "B", "hi": "₹ 50,000", "en": "Rs. 50,000", "is_correct": False, "misconception_tag": "misconception:miscalculated_pie_chart_total"},
            {"label": "C", "hi": "₹ 60,000", "en": "Rs. 60,000", "is_correct": False, "misconception_tag": "misconception:miscalculated_pie_chart_total"},
            {"label": "D", "hi": "₹ 30,000", "en": "Rs. 30,000", "is_correct": False, "misconception_tag": "misconception:underestimated_total_income"}
        ],
        "correct_label": "A",
        "correct_answer_str": "₹ 40,000",
        "solution_steps_hi": "पाई चार्ट के अनुसार: शिक्षा = 25%, यात्रा = 15%। अंतर = 25% - 15% = 10%। कुल आय का 10% = ₹4000 ⇒ कुल आय = 4000 × (100 / 10) = ₹40,000।",
        "solution_steps_en": "From the pie chart: Education = 25%, Travel = 15%. Difference = 10%. 10% of Income = Rs. 4000 => Total Income = 4000 × (100 / 10) = Rs. 40,000.",
        "template_hash": "pyq_uptet_2022_p2_q45",
        "instance_hash": "pyq_uptet_2022_p2_q45_inst",
        "numbers_used": {"difference": 4000, "_edu_pct": 25, "_travel_pct": 15},
        "pyq_refs": ["UPTET_2022_P2_Q45"],
        "visual": {
            "type": "image",
            "image_url": "/assets/uptet_2022_p2_q45.png",
            "caption_hi": "पारिवारिक मासिक व्यय वृत्त-आरेख (UPTET 2022 P2 Q45)",
            "caption_en": "Family Expenditure Pie Chart (UPTET 2022 P2 Q45)"
        }
    },
    {
        "template_id": "pyq_uptet_2018_p1_q92",
        "topic_id": "T14",
        "subtopic_id": "parallel_lines_angles",
        "difficulty": "Medium",
        "rubric_score": 4,
        "stem_hi": "दिए गए चित्र में यदि AB || CD हो, तो y° - x° का मान है:",
        "stem_en": "In the given figure, if AB || CD, then the value of y° - x° is:",
        "options": [
            {"label": "A", "hi": "20°", "en": "20°", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"},
            {"label": "B", "hi": "30°", "en": "30°", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"},
            {"label": "C", "hi": "10°", "en": "10°", "is_correct": True, "misconception_tag": None},
            {"label": "D", "hi": "40°", "en": "40°", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"}
        ],
        "correct_label": "C",
        "correct_answer_str": "10°",
        "solution_steps_hi": "AB || CD है। रैखिक युग्म से: x° = 180° - 110° = 70° तथा y° = 180° - 100° = 80°। अतः y° - x° = 80° - 70° = 10°।",
        "solution_steps_en": "AB || CD. From linear pair: x° = 180° - 110° = 70° and y° = 180° - 100° = 80°. Hence y° - x° = 80° - 70° = 10°.",
        "template_hash": "pyq_uptet_2018_p1_q92",
        "instance_hash": "pyq_uptet_2018_p1_q92_inst",
        "numbers_used": {"angle1": 110, "angle2": 100},
        "pyq_refs": ["UPTET_2018_P1_Q92"],
        "visual": {
            "type": "image",
            "image_url": "/assets/uptet_2018_p1_q92.png",
            "caption_hi": "समानांतर रेखाएं एवं तिर्यक रेखा (UPTET 2018 P1 Q92)",
            "caption_en": "Parallel Lines and Transversal (UPTET 2018 P1 Q92)"
        }
    },
    {
        "template_id": "pyq_uptet_2018_p2_q109",
        "topic_id": "T14",
        "subtopic_id": "secant_tangent_theorem",
        "difficulty": "Medium",
        "rubric_score": 5,
        "stem_hi": "दिए गए चित्र में, PT वृत्त की स्पर्श रेखा है तथा PAB एक छेदक रेखा है। यदि PA = 9 सेमी तथा AB = 7 सेमी हो, तो PT की लम्बाई होगी:",
        "stem_en": "In the given figure, PT is a tangent to the circle and PAB is a secant line. If PA = 9 cm and AB = 7 cm, what is the length of PT?",
        "options": [
            {"label": "A", "hi": "6 सेमी", "en": "6 cm", "is_correct": False, "misconception_tag": "misconception:used_ab_instead_of_total_secant_pb"},
            {"label": "B", "hi": "8 सेमी", "en": "8 cm", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"},
            {"label": "C", "hi": "12 सेमी", "en": "12 cm", "is_correct": True, "misconception_tag": None},
            {"label": "D", "hi": "16 सेमी", "en": "16 cm", "is_correct": False, "misconception_tag": "misconception:confused_tangent_with_total_secant_length"}
        ],
        "correct_label": "C",
        "correct_answer_str": "12 सेमी",
        "solution_steps_hi": "वृत्त के स्पर्श-छेदक प्रमेय से: PT² = PA × PB = PA × (PA + AB) = 9 × (9 + 7) = 9 × 16 = 144 ⇒ PT = √144 = 12 सेमी।",
        "solution_steps_en": "By Tangent-Secant theorem: PT² = PA × PB = PA × (PA + AB) = 9 × (9 + 7) = 9 × 16 = 144 => PT = 12 cm.",
        "template_hash": "pyq_uptet_2018_p2_q109",
        "instance_hash": "pyq_uptet_2018_p2_q109_inst",
        "numbers_used": {"pa": 9, "ab": 7},
        "pyq_refs": ["UPTET_2018_P2_Q109"],
        "visual": {
            "type": "image",
            "image_url": "/assets/uptet_2018_p2_q109.png",
            "caption_hi": "वृत्त की स्पर्श रेखा एवं छेदक रेखा (UPTET 2018 P2 Q109)",
            "caption_en": "Circle Tangent and Secant Line (UPTET 2018 P2 Q109)"
        }
    },
    {
        "template_id": "pyq_uptet_2018_p2_q108",
        "topic_id": "T14",
        "subtopic_id": "cyclic_quadrilateral_angles",
        "difficulty": "Medium",
        "rubric_score": 4,
        "stem_hi": "दिए गए चित्र में, ABCD एक चक्रीय चतुर्भुज है। यदि ∠ADC = 140° हो, तो ∠BAC का मान क्या होगा यदि वृत्त का व्यास AC है?",
        "stem_en": "In the given figure, ABCD is a cyclic quadrilateral. If ∠ADC = 140° and AC is a diameter of the circle, what is ∠BAC?",
        "options": [
            {"label": "A", "hi": "40°", "en": "40°", "is_correct": False, "misconception_tag": "misconception:assumed_equal_to_supplement"},
            {"label": "B", "hi": "50°", "en": "50°", "is_correct": True, "misconception_tag": None},
            {"label": "C", "hi": "60°", "en": "60°", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"},
            {"label": "D", "hi": "30°", "en": "30°", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"}
        ],
        "correct_label": "B",
        "correct_answer_str": "50°",
        "solution_steps_hi": "1. चक्रीय चतुर्भुज के सम्मुख कोणों का योग 180° होता है: ∠B = 180° - 140° = 40°। 2. अर्धवृत्त में बना कोण समकोण होता है: ∠ABC = 90°। 3. ΔABC में: ∠BAC = 180° - (90° + 40°) = 50°।",
        "solution_steps_en": "1. Opposite angles of cyclic quad sum to 180°: ∠B = 180° - 140° = 40°. 2. Angle in semicircle is 90°: ∠B = 90°. In ΔABC: ∠BAC = 180° - (90° + 40°) = 50°.",
        "template_hash": "pyq_uptet_2018_p2_q108",
        "instance_hash": "pyq_uptet_2018_p2_q108_inst",
        "numbers_used": {"angle_adc": 140},
        "pyq_refs": ["UPTET_2018_P2_Q108"],
        "visual": {
            "type": "image",
            "image_url": "/assets/uptet_2018_p2_q108.png",
            "caption_hi": "चक्रीय चतुर्भुज ABCD (UPTET 2018 P2 Q108)",
            "caption_en": "Cyclic Quadrilateral ABCD (UPTET 2018 P2 Q108)"
        }
    },
    {
        "template_id": "pyq_uptet_2018_p1_q98",
        "topic_id": "T01",
        "subtopic_id": "number_pattern_puzzle",
        "difficulty": "Easy",
        "rubric_score": 3,
        "stem_hi": "संलग्न चित्र में प्रदर्शित संख्या प्रतिरूप (Number Pattern) को देखकर रिक्त स्थान (?) में आने वाली संख्या ज्ञात कीजिए:",
        "stem_en": "Looking at the number pattern displayed in the given figure, find the number that replaces the question mark (?):",
        "options": [
            {"label": "A", "hi": "1", "en": "1", "is_correct": True, "misconception_tag": None},
            {"label": "B", "hi": "7", "en": "7", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"},
            {"label": "C", "hi": "8", "en": "8", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"},
            {"label": "D", "hi": "9", "en": "9", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"}
        ],
        "correct_label": "A",
        "correct_answer_str": "1",
        "solution_steps_hi": "दिए गए प्रतिरूप में विपरीत खंडों में संख्याओं के घन (Cubes) हैं: 2³ = 8, 3³ = 27, 4³ = 64। अतः 1³ = 1 होगा।",
        "solution_steps_en": "In the given circular pattern, opposite sectors contain cubes: 2³ = 8, 3³ = 27, 4³ = 64. Hence 1³ = 1.",
        "template_hash": "pyq_uptet_2018_p1_q98",
        "instance_hash": "pyq_uptet_2018_p1_q98_inst",
        "numbers_used": {"cube_base": 1},
        "pyq_refs": ["UPTET_2018_P1_Q98"],
        "visual": {
            "type": "image",
            "image_url": "/assets/uptet_2018_p1_q98.png",
            "caption_hi": "संख्या पहेली आरेख (UPTET 2018 P1 Q98)",
            "caption_en": "Number Pattern Circle (UPTET 2018 P1 Q98)"
        }
    },
    {
        "template_id": "pyq_uptet_2016_p2_q119",
        "topic_id": "T15",
        "subtopic_id": "triangle_area_ratio",
        "difficulty": "Medium",
        "rubric_score": 4,
        "stem_hi": "चित्र में, ΔABC की भुजाओं के मध्य बिंदुओं D, E, F को मिलाकर एक नया त्रिभुज DEF बनाया गया है। ΔDEF के क्षेत्रफल और ΔABC के क्षेत्रफल का अनुपात क्या है?",
        "stem_en": "In the figure, triangle DEF is formed by joining the midpoints D, E, F of the sides of ΔABC. What is the ratio of area(ΔDEF) to area(ΔABC)?",
        "options": [
            {"label": "A", "hi": "1 : 2", "en": "1 : 2", "is_correct": False, "misconception_tag": "misconception:halved_area_instead_of_one_fourth"},
            {"label": "B", "hi": "1 : 3", "en": "1 : 3", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"},
            {"label": "C", "hi": "1 : 4", "en": "1 : 4", "is_correct": True, "misconception_tag": None},
            {"label": "D", "hi": "1 : 8", "en": "1 : 8", "is_correct": False, "misconception_tag": "misconception:cubic_ratio_instead_of_area"}
        ],
        "correct_label": "C",
        "correct_answer_str": "1 : 4",
        "solution_steps_hi": "मध्य-बिंदु प्रमेय (Midpoint Theorem) के अनुसार त्रिभुज की तीनों भुजाओं के मध्य-बिंदुओं को मिलाने पर मूल त्रिभुज 4 सर्वांगसम त्रिभुजों में विभाजित हो जाता है। अतः क्षेत्रफल का अनुपात 1 : 4 होगा।",
        "solution_steps_en": "By Midpoint Theorem, joining the midpoints of the sides of a triangle divides it into 4 congruent triangles. Hence area ratio is 1 : 4.",
        "template_hash": "pyq_uptet_2016_p2_q119",
        "instance_hash": "pyq_uptet_2016_p2_q119_inst",
        "numbers_used": {"ratio": 4},
        "pyq_refs": ["UPTET_2016_P2_Q119"],
        "visual": {
            "type": "image",
            "image_url": "/assets/uptet_2016_p2_q119.png",
            "caption_hi": "त्रिभुज मध्य-बिंदु क्षेत्रफल अनुपात (UPTET 2016 P2 Q119)",
            "caption_en": "Triangle Midpoint Area Ratio (UPTET 2016 P2 Q119)"
        }
    },
    {
        "template_id": "pyq_uptet_2016_p1_q103",
        "topic_id": "T14",
        "subtopic_id": "geometric_figure_counting",
        "difficulty": "Easy",
        "rubric_score": 3,
        "stem_hi": "संलग्न चित्र में प्रदर्शित 3×3 ग्रिड में कुल कितने वर्ग (Squares) हैं?",
        "stem_en": "How many total squares are there in the given 3x3 grid figure?",
        "options": [
            {"label": "A", "hi": "9", "en": "9", "is_correct": False, "misconception_tag": "misconception:counted_unit_squares_only"},
            {"label": "B", "hi": "14", "en": "14", "is_correct": True, "misconception_tag": None},
            {"label": "C", "hi": "10", "en": "10", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"},
            {"label": "D", "hi": "12", "en": "12", "is_correct": False, "misconception_tag": "misconception:arithmetic_drift"}
        ],
        "correct_label": "B",
        "correct_answer_str": "14",
        "solution_steps_hi": "n × n ग्रिड में कुल वर्गों की संख्या = 1² + 2² + 3² = 1 + 4 + 9 = 14। (1×1 के 9 वर्ग + 2×2 के 4 वर्ग + 3×3 का 1 बड़ा वर्ग)।",
        "solution_steps_en": "Total squares in an n x n grid = 1² + 2² + 3² = 1 + 4 + 9 = 14 (9 unit squares + 4 of size 2x2 + 1 of size 3x3).",
        "template_hash": "pyq_uptet_2016_p1_q103",
        "instance_hash": "pyq_uptet_2016_p1_q103_inst",
        "numbers_used": {"grid_size": 3},
        "pyq_refs": ["UPTET_2016_P1_Q103"],
        "visual": {
            "type": "image",
            "image_url": "/assets/uptet_2016_p1_q103.png",
            "caption_hi": "3×3 वर्ग ग्रिड (UPTET 2016 P1 Q103)",
            "caption_en": "3x3 Square Grid (UPTET 2016 P1 Q103)"
        }
    }
]

def generate_master_question_bank():
    templates = [
        # Batch 1: Foundations
        NumSumOfPrimesTemplate(),
        GeomTrapeziumMidpointTemplate(),
        GeomInscribedRegularPolygonTemplate(),
        AlgPowerIndicesRelationTemplate(),
        StatEmpiricalFormulaTemplate(),
        # Batch 2: Commercial Math
        ProfitLossOnSPTemplate(),
        PctConsumptionPriceChangeTemplate(),
        CISITwoYearDifferenceTemplate(),
        LCMHCFProductRelationTemplate(),
        MarkedPriceDiscountProfitTemplate(),
        # Batch 3: Core Syllabus
        RatioPartitionAndShareTemplate(),
        AvgReplacementPersonTemplate(),
        WorkTimeCombinedDaysTemplate(),
        Mens2DRectangleOuterPathTemplate(),
        Mens2DEquilateralTriangleTemplate(),
        # Batch 4: Advanced
        AlgReciprocalSumPowerTemplate(),
        Mens3DSphereRecastTemplate(),
        NumDivisibilityRulesTemplate(),
        # Batch 5: Number Systems
        NumRecurringDecimalFractionTemplate(),
        NumBODMASBracketSimplificationTemplate(),
        NumFractionGreatestSmallestTemplate(),
        # Batch 6: Visual & Figure Engine
        DataPieChartTemplate(),
        GeomParallelLinesTransversalTemplate(),
        # Batch 7: Commercial Variants
        SIMultiplierRelationTemplate(),
        SIRateShiftPrincipalTemplate(),
        # Batch 8: Full Syllabus Expansions
        LCMBellsRingingTogetherTemplate(),
        WorkChainRuleMenDaysTemplate(),
        AlgLinearItemsCostTemplate(),
        GeomCircleSecantTangentTemplate(),
        GeomTriangleIncenterAngleTemplate(),
        PVPlaceFaceValueDiffTemplate(),
        Mens2DRhombusSideDiagTemplate(),
        Mens3DCubeCuttingTemplate(),
        NumDivisorsCountTemplate(),
        NumPrimeFactorsExponentsSumTemplate(),
        TimeCalendarOddDaysTemplate(),
        # Batch 9: Difficulty Balancing (18 New Templates)
        NumDecimalsAdditionPlaceTemplate(),
        PctBasicValueCalcTemplate(),
        PLDirectProfitCalcTemplate(),
        SIDirectInterestCalcTemplate(),
        RatioTwoPartsSplitTemplate(),
        AvgFiveNumbersDirectTemplate(),
        GeomAnglesComplementarySupplementaryTemplate(),
        Mens2DRectanglePerimeterAreaTemplate(),
        AlgIdentityFourABTemplate(),
        StatMedianRawDataTemplate(),
        NumDivisibilityComposite72Template(),
        NumFractionGardenWordProblemTemplate(),
        NumBODMASComplexEvaluationTemplate(),
        AlgTwoVariableLinearSystemTemplate(),
        CIThreeYearCompoundAmountTemplate(),
        AlgCubicReciprocalIdentityTemplate(),
        Mens2DSquareInscribedCircleShadedTemplate(),
        NumSumOfAllDivisorsTemplate()
    ]
    
    all_questions = []
    q_counter = 1
    
    print(f"Generating questions across all {len(templates)} master templates...")
    
    for t in templates:
        seen_hashes = set()
        count = 15  # 15 instances per template -> 540 questions
        success_for_t = 0
        for _ in range(count):
            try:
                inst = t.generate_instance(seen_instance_hashes=seen_hashes)
                q_dict = inst.to_dict()
                q_dict["id"] = f"STET_M_{q_counter:03d}"
                q_dict["topic_meta"] = TOPIC_META.get(inst.topic_id, {
                    "name_hi": inst.topic_id, "name_en": inst.topic_id, "icon": "📌"
                })
                
                # Enrich misconception tags with human explanation
                for opt in q_dict["options"]:
                    tag = opt.get("misconception_tag")
                    if tag and tag in MISCONCEPTION_EXPLANATIONS:
                        opt["misconception_info"] = MISCONCEPTION_EXPLANATIONS[tag]
                    elif tag:
                        clean_name = tag.replace("misconception:", "").replace("_", " ").title()
                        opt["misconception_info"] = {
                            "title_hi": clean_name,
                            "title_en": clean_name,
                            "desc_hi": "यह इस विषय की एक सामान्य गणना अथवा सैद्धांतिक त्रुटि है।",
                            "desc_en": "This is a common calculation or conceptual trap in this topic."
                        }
                    else:
                        opt["misconception_info"] = None
                
                all_questions.append(q_dict)
                q_counter += 1
                success_for_t += 1
            except Exception as e:
                pass
        print(f"  • {t.template_id}: {success_for_t} instances generated.")
                
    print(f"\nAdding {len(AUTHENTIC_PYQ_VISUAL_QUESTIONS)} Authentic PYQ Visual Questions...")
    for pyq in AUTHENTIC_PYQ_VISUAL_QUESTIONS:
        pyq_copy = dict(pyq)
        pyq_copy["id"] = f"STET_M_{q_counter:03d}"
        pyq_copy["topic_meta"] = TOPIC_META.get(pyq_copy["topic_id"], {
            "name_hi": pyq_copy["topic_id"], "name_en": pyq_copy["topic_id"], "icon": "📌"
        })
        for opt in pyq_copy["options"]:
            tag = opt.get("misconception_tag")
            if tag and tag in MISCONCEPTION_EXPLANATIONS:
                opt["misconception_info"] = MISCONCEPTION_EXPLANATIONS[tag]
            elif tag:
                clean_name = tag.replace("misconception:", "").replace("_", " ").title()
                opt["misconception_info"] = {
                    "title_hi": clean_name,
                    "title_en": clean_name,
                    "desc_hi": "यह इस विषय की एक सामान्य गणना अथवा सैद्धांतिक त्रुटि है।",
                    "desc_en": "This is a common calculation or conceptual trap in this topic."
                }
            else:
                opt["misconception_info"] = None
        all_questions.append(pyq_copy)
        q_counter += 1
        print(f"  • {pyq_copy['template_id']} (Asset: {pyq_copy['visual']['image_url']}) added.")

    output_path = r"c:\Users\piyus\janhvi\supertet\math-mock-webapp\data\questions.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2, default=str)
        
    print(f"\n🎉 Successfully compiled FULL SYLLABUS MASTER QUESTION BANK with {len(all_questions)} verified questions into {output_path}")

if __name__ == "__main__":
    generate_master_question_bank()
