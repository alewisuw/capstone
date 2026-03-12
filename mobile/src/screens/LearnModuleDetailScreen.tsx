import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import Ionicons from '../components/Icon';
import AppLogo from '../components/AppLogo';
import { theme } from '../theme';
import GradientBackground from '../components/GradientBackground';
import { learnTopics } from '../data/learnContent';
import BillCard from '../components/BillCard';
import BillStatusBadge, { getStatusConfig } from '../components/BillStatusBadge';
import SearchBar from '../components/SearchBar';
import InterestChips from '../components/InterestChips';
import type { BillRecommendation } from '../types';

type LearnModuleDetailProps = StackScreenProps<RootStackParamList, 'LearnModuleDetail'>;

const LearnModuleDetailScreen: React.FC<LearnModuleDetailProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const topic = learnTopics[route.params.topic];
  const module = topic.modules.find((item) => item.id === route.params.moduleId);
  const billProcessStages = [
    {
      statusCode: 'houseat1streading',
      title: 'Bill Introduction (First Reading)',
      bullets: [
        'A bill is introduced in either the House of Commons of Canada or the Senate of Canada.',
        'The bill is presented and printed.',
        'There is no debate or vote on the content yet.',
      ],
    },
    {
      statusCode: 'houseat2ndreading',
      title: 'Second Reading',
      bullets: [
        'Members debate the principle and purpose of the bill.',
        'Legislators discuss whether the bill is a good idea.',
        'A vote determines whether the bill moves forward.',
      ],
    },
    {
      statusCode: 'houseincommittee',
      title: 'Committee Stage',
      bullets: [
        'The bill is studied by a parliamentary committee.',
        'Experts, stakeholders, and government officials may testify.',
        'The committee reviews the bill line-by-line and may propose amendments.',
      ],
    },
    {
      statusCode: 'houseatreportstage',
      title: 'Report Stage',
      bullets: [
        'The committee reports the bill back to the chamber.',
        'Additional amendments can be proposed.',
        'Members debate and vote on the revised version.',
      ],
    },
    {
      statusCode: 'houseat3rdreading',
      title: 'Third Reading',
      bullets: [
        'Final debate on the completed bill.',
        'Members vote on whether the bill should pass that chamber.',
      ],
    },
    {
      statusCode: 'senateat1streading',
      title: 'Review by the Other Chamber',
      bullets: [
        'The bill goes to the other chamber of Parliament (House or Senate).',
        'It goes through the same stages again: first reading, second reading, committee, report stage, and third reading.',
      ],
    },
    {
      statusCode: 'royalassentgiven',
      title: 'Royal Assent',
      bullets: [
        'Once both chambers approve the same version, the Governor General of Canada grants Royal Assent on behalf of Charles III.',
        'At this point, the bill officially becomes law (an Act of Parliament).',
      ],
    },
  ];
  const additionalStages = [
    {
      statusCode: 'senateat1streading',
      title: 'First Reading (Senate)',
      description: 'The bill is introduced in the Senate without debate.',
    },
    {
      statusCode: 'senateat2ndreading',
      title: 'Second Reading (Senate)',
      description: 'Senators debate the principle of the bill.',
    },
    {
      statusCode: 'senateincommittee',
      title: 'Committee Stage (Senate)',
      description: 'A Senate committee studies the bill and suggests changes.',
    },
    {
      statusCode: 'senateatreportstage',
      title: 'Report Stage (Senate)',
      description: 'Committee findings are reported back to the Senate.',
    },
    {
      statusCode: 'senateat3rdreading',
      title: 'Third Reading (Senate)',
      description: 'Final debate and vote in the Senate.',
    },
    {
      statusCode: 'outsideorderprecedence',
      title: 'Outside Order of Precedence',
      description: 'This bill is not currently prioritized for debate.',
    },
    {
      statusCode: 'billdefeated',
      title: 'Bill Defeated',
      description: 'This bill was voted down and will not advance.',
    },
    {
      statusCode: 'willnotbeproceededwith',
      title: 'Will Not Be Proceeded With',
      description: 'This bill is no longer moving forward.',
    },
  ];
  const demoBill: BillRecommendation = {
    bill_id: 12,
    bill_number: 'C-12',
    title: 'DEMO: An Act to strengthen climate accountability',
    summary: 'This bill sets national targets and reporting requirements.',
    status_code: 'houseat2ndreading',
    last_updated: '2024-11-12',
    tags: ['Climate', 'Environment', 'Accountability'],
  };

  const demoBillSecondary: BillRecommendation = {
    bill_id: 48,
    bill_number: 'C-28',
    title: 'DEMO: An Act to modernize digital privacy protections',
    summary: 'Updates privacy rules and enforcement powers.',
    status_code: 'houseincommittee',
    last_updated: '2024-10-05',
    tags: ['Privacy', 'Technology'],
  };

  if (!module) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <GradientBackground style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { top: insets.top + 20, left: 16 },
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
          >
            <Ionicons name="arrow-back" size={18} color={theme.colors.accentDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Module not found</Text>
          <View style={[styles.topRightLogo, { top: insets.top + 10 }]}>
            <AppLogo width={44} height={44} />
          </View>
        </GradientBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <GradientBackground style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { top: insets.top + 20, left: 16 },
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.accentDark} />
        </Pressable>
        <Text style={styles.headerTitle}>{module.title}</Text>
        <Text style={styles.headerSubtitle}>{topic.title}</Text>
        <View style={[styles.topRightLogo, { top: insets.top + 10 }]}>
          <AppLogo width={44} height={44} />
        </View>
      </GradientBackground>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {topic.key === 'billboard' ? (
          <View style={styles.detailCard}>
            <Text style={styles.sectionHeading}>In-App Example</Text>
            {module.id === 'recommendations' || module.id === 'basics' ? (
              <>
                <View pointerEvents="none">
                  <BillCard bill={demoBill} onPress={() => {}} />
                </View>
              </>
            ) : null}

            {module.id === 'saved' ? (
              <>
                <View pointerEvents="none">
                  <BillCard
                    bill={demoBill}
                    onPress={() => {}}
                    isSaved
                    onToggleSave={() => {}}
                  />
                  <BillCard
                    bill={demoBillSecondary}
                    onPress={() => {}}
                    isSaved
                    onToggleSave={() => {}}
                  />
                </View>
                <Text style={styles.sectionBody}>
                  Saved bills list the same cards you bookmark, ready to revisit.
                </Text>
              </>
            ) : null}

            {module.id === 'search' ? (
              <>
                <View pointerEvents="none">
                  <SearchBar
                    value="Digital Privacy"
                    placeholder="Search by topic, issue, or phrase"
                    onChangeText={() => {}}
                    onSubmit={() => {}}
                    onActionPress={() => {}}
                    editable={false}
                    disabled
                  />
                  <View style={styles.previewSpacer} />
                  <BillCard bill={demoBillSecondary} onPress={() => {}} />
                </View>
              </>
            ) : null}

            {module.id === 'profile' ? (
              <>
                <View style={styles.profilePreview} pointerEvents="none">
                  <View style={styles.profileRow}>
                    <Ionicons name="person-circle" size={48} color={theme.colors.accent} />
                    <View>
                      <Text style={styles.profileName}>Your Profile</Text>
                      <Text style={styles.profileCaption}>Interests & personalization</Text>
                    </View>
                  </View>
                  <InterestChips
                    interests={['Housing', 'Healthcare', 'Climate']}
                    labelTransform={(value) =>
                      value.replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase())
                    }
                  />
                </View>
                <Text style={styles.sectionBody}>
                  Profile controls let you edit or remove interests and personalization preferences.
                </Text>
              </>
            ) : null}
          </View>
        ) : null}

        {topic.key === 'billboard' && module.details.length > 0 ? (
          <View style={styles.detailCard}>
            <Text style={styles.sectionHeading}>Key Points</Text>
            {module.details.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {topic.key === 'legislation' && module.id === 'bill-process' ? (
          <View style={styles.detailCard}>
            <Text style={styles.sectionHeading}>Stages of a Bill</Text>
            {billProcessStages.map((stage) => (
              <View key={stage.title} style={styles.stageRow}>
                <View style={styles.stageIconColumn}>
                  <BillStatusBadge
                    statusCode={stage.statusCode}
                    showLabel={false}
                    showPhaseTag
                    enableTooltip={false}
                    size={28}
                    containerStyle={styles.stageBadgeColumn}
                  />
                </View>
                <View style={styles.stageBody}>
                  <Text style={[styles.stageTitle, { color: getStatusConfig(stage.statusCode).color }]}>
                    {stage.title}
                  </Text>
                  {stage.bullets.map((bullet) => (
                    <View key={bullet} style={styles.stageBulletRow}>
                      <View style={styles.stageBulletDot} />
                      <Text style={styles.stageDescription}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <Text style={styles.sectionSubheading}>Other Statuses</Text>
            {additionalStages.map((stage) => (
              <View key={stage.title} style={styles.stageRow}>
                <View style={styles.stageIconColumn}>
                  <BillStatusBadge
                    statusCode={stage.statusCode}
                    showLabel={false}
                    showPhaseTag
                    enableTooltip={false}
                    size={28}
                    containerStyle={styles.stageBadgeColumn}
                  />
                </View>
                <View style={styles.stageBody}>
                  <Text style={[styles.stageTitle, { color: getStatusConfig(stage.statusCode).color }]}>
                    {stage.title}
                  </Text>
                  <Text style={styles.stageDescription}>{stage.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {topic.key === 'legislation' && module.id === 'lawmakers' ? (
          <>
            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Overview</Text>
              <Text style={styles.sectionBody}>
                Canadian federal laws are created through a legislative process involving several key institutions
                in Parliament and the federal government. The main participants are elected representatives, appointed
                senators, the executive branch, and the Governor General. Each group plays a different role in proposing,
                reviewing, approving, and formally enacting laws.
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Key participants in making Canadian federal laws</Text>

              <Text style={styles.stageTitle}>Members of Parliament (MPs) in the House of Commons of Canada</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>MPs are elected by citizens across Canada.</Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  They introduce bills, debate proposed laws, review them in committees, and vote on whether they
                  should pass.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Senators in the Senate of Canada</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>Senators are appointed and act as a reviewing body.</Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  They examine legislation passed by the House of Commons, study it in committees, and may suggest
                  amendments before approving it.
                </Text>
              </View>

              <Text style={styles.stageTitle}>The executive branch (government)</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>Led by the Prime Minister of Canada and Cabinet ministers.</Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  They develop policy ideas, oversee the drafting of legislation with government departments, and
                  introduce most government bills in Parliament.
                </Text>
              </View>

              <Text style={styles.stageTitle}>The Governor General</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>The Governor General of Canada represents Charles III.</Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Gives Royal Assent, the final approval required for a bill to become law.
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Summary</Text>
              <Text style={styles.sectionBody}>
                Federal laws in Canada are created through cooperation between elected officials, appointed senators,
                the federal government, and the Governor General, ensuring that legislation is debated, reviewed, and
                formally approved before becoming law.
              </Text>
            </View>
          </>
        ) : null}

        {topic.key === 'legislation' && module.id === 'bill-types' ? (
          <>
            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Overview</Text>
              <Text style={styles.sectionBody}>
                In the Canadian federal system, a bill is a proposed law that must be debated and approved by
                Parliament before it becomes law. Bills can originate from the government, individual members of
                Parliament, or the Senate, and they are categorized based on who introduces them and what they affect.
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Types of Bills in Canada</Text>

              <Text style={styles.stageTitle}>Government Bills</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Introduced by Cabinet ministers in the House of Commons of Canada or the Senate of Canada.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Represent the policies and priorities of the federal government.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Most laws passed by Parliament are government bills because the governing party usually has the
                  most support in the House of Commons.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Private Members’ Bills</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Introduced by MPs who are not Cabinet ministers.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Often address specific issues or policy changes that may not be part of the government’s agenda.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Fewer of these bills become law because they receive less parliamentary time and support.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Senate Public Bills</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Introduced by senators in the Senate of Canada.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Deal with public policy affecting the general population.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  They must still be approved by the House of Commons before becoming law.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Private Bills</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Proposed to grant special powers or benefits to a specific person, organization, or group rather
                  than the public as a whole.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Often used by corporations, municipalities, or organizations seeking exceptions to general laws.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  They go through a special review process in Parliament.
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Summary</Text>
              <Text style={styles.sectionBody}>
                Canadian federal bills fall into several categories depending on who introduces them and whom they
                affect. Government bills represent official government policy, private members’ bills come from
                individual MPs, Senate public bills originate in the Senate, and private bills address the needs of
                specific individuals or organizations. These different types allow Parliament to address both
                national policies and specific legal requests.
              </Text>
            </View>
          </>
        ) : null}

        {topic.key === 'legislation' && module.id === 'amendments' ? (
          <>
            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Overview</Text>
              <Text style={styles.sectionBody}>
                In the Canadian federal system, bills can be amended (changed or modified) during the legislative
                process before they become law. Amendments allow Parliament to improve legislation by correcting
                errors, clarifying wording, or adjusting policies. These changes are usually made during debates or
                committee review in either chamber of Parliament.
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>How Bills Are Amended in Canada</Text>

              <Text style={styles.stageTitle}>Committee Stage</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Most amendments happen when a bill is studied by a parliamentary committee from the House of Commons
                  of Canada or the Senate of Canada.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Committees examine the bill line by line and may propose changes based on expert testimony and
                  discussion.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Report Stage</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  After the committee review, the bill returns to the full chamber.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Members of Parliament or senators can propose additional amendments, which are debated and voted on.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Second Chamber Review</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Once a bill passes one chamber, it moves to the other (House or Senate).
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  The second chamber can also propose amendments through its own committee review and debates.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Agreement Between Chambers</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  If one chamber amends the bill, the other chamber must review and approve those changes.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Both chambers must agree on the same final version before the bill can proceed.
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Summary</Text>
              <Text style={styles.sectionBody}>
                Bills in Canada are amended mainly during committee review and report stages in Parliament. Both the
                House of Commons and the Senate can propose changes, but the bill must be approved in the same form by
                both chambers before it can receive Royal Assent and become law.
              </Text>
            </View>
          </>
        ) : null}

        {topic.key === 'governance' && module.id === 'policy' ? (
          <>
            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Overview</Text>
              <Text style={styles.sectionBody}>
                Public policy refers to the actions, decisions, and laws that governments create to address issues
                affecting society. In Canada, public policy is developed through a process involving government
                leaders, public servants, Parliament, and public input. It guides how the federal government responds
                to national challenges such as healthcare, the economy, the environment, and national security.
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>What Public Policy Is and How It Is Made</Text>

              <Text style={styles.stageTitle}>Definition of Public Policy</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Public policy includes laws, regulations, programs, and decisions created by the federal government
                  to address public problems and goals.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Policy Development by Government</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Policy ideas are often developed by the executive branch, led by the Prime Minister of Canada and
                  Cabinet ministers.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Government departments research issues and prepare policy proposals.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Consultation and Public Input</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  The government may consult experts, interest groups, provinces, and citizens to gather information
                  and feedback on proposed policies.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Legislative Review in Parliament</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  If a policy requires legislation, a bill is introduced and debated in the House of Commons of Canada
                  and reviewed by the Senate of Canada before becoming law.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Implementation</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Once approved, government departments and agencies put the policy into action through programs,
                  regulations, and enforcement.
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Summary</Text>
              <Text style={styles.sectionBody}>
                Public policy in Canada refers to the government’s plans and actions to address public issues. It is
                created through research, consultation, and decision-making by the executive branch, then often
                reviewed and approved through the legislative process in Parliament before being implemented by
                government departments.
              </Text>
            </View>
          </>
        ) : null}

        {topic.key === 'governance' && module.id === 'structure' ? (
          <>
            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Overview</Text>
              <Text style={styles.sectionBody}>
                The Canadian government is structured as a federal parliamentary democracy and constitutional monarchy.
                This means that political power is shared between different levels of government and that elected
                representatives govern within a system where the monarch is the formal head of state. The federal
                government operates through three main branches: executive, legislative, and judicial.
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Structure of the Canadian Federal Government</Text>

              <Text style={styles.stageTitle}>The Executive Branch</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Responsible for running the government and implementing laws.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Led by the Prime Minister of Canada and the Cabinet.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Cabinet ministers oversee federal departments and develop government policies.
                </Text>
              </View>

              <Text style={styles.stageTitle}>The Legislative Branch (Parliament)</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Responsible for making and approving federal laws.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>Parliament consists of three parts:</Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  House of Commons of Canada – elected Members of Parliament debate and vote on legislation.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Senate of Canada – appointed senators review and suggest changes to bills.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Governor General of Canada – represents Charles III and grants Royal Assent for bills to become law.
                </Text>
              </View>

              <Text style={styles.stageTitle}>The Judicial Branch</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Responsible for interpreting laws and ensuring they follow the Constitution.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  The highest court is the Supreme Court of Canada, which makes final legal decisions and can rule on
                  the constitutionality of laws.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Federalism (Division of Powers)</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Canada’s system divides responsibilities between the federal government and provincial governments.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  The federal government handles national issues such as defense, trade, and immigration.
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Summary</Text>
              <Text style={styles.sectionBody}>
                The Canadian federal government is structured around three branches—executive, legislative, and
                judicial—within a federal parliamentary democracy. The executive leads and administers government
                policy, Parliament creates laws, and the courts interpret and uphold the Constitution.
              </Text>
            </View>
          </>
        ) : null}

        {topic.key === 'governance' && module.id === 'parliament' ? (
          <>
            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Overview</Text>
              <Text style={styles.sectionBody}>
                Parliament in Canada operates through daily procedures that allow elected representatives to debate
                issues, review legislation, and hold the government accountable. These activities take place mainly in
                the House of Commons of Canada and the Senate of Canada, where members follow formal rules and
                schedules to conduct government business.
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>How Parliament Works Day to Day</Text>

              <Text style={styles.stageTitle}>Debates and Legislative Business</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Members of Parliament (MPs) debate proposed bills and government policies.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Senators also debate legislation and review bills passed by the House of Commons.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Question Period</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  MPs question government ministers about policies, decisions, and current issues.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  This is a key way Parliament holds the government accountable.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Committee Meetings</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Parliamentary committees study bills, review government programs, and investigate issues in detail.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Committees may hear testimony from experts, officials, and members of the public.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Voting and Decision Making</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  MPs and senators vote on bills, amendments, and motions.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  These votes determine whether legislation moves forward or is rejected.
                </Text>
              </View>

              <Text style={styles.stageTitle}>Statements and Discussions</Text>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  MPs can make short statements about issues affecting their communities.
                </Text>
              </View>
              <View style={styles.stageBulletRow}>
                <View style={styles.stageBulletDot} />
                <Text style={styles.stageDescription}>
                  Members may also debate national or international matters.
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionHeading}>Summary</Text>
              <Text style={styles.sectionBody}>
                On a daily basis, Canada’s Parliament functions through debates, Question Period, committee work, and
                voting on legislation. These activities allow MPs and senators to represent citizens, review government
                actions, and make decisions about national laws and policies.
              </Text>
            </View>
          </>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 2,
  },
  backButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: theme.spacing.xs,
    paddingLeft: 44,
    paddingRight: 84,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    paddingLeft: 44,
    paddingRight: 84,
  },
  topRightLogo: {
    position: 'absolute',
    right: 14,
    top: 55,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionSubheading: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 12,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: theme.spacing.xs,
  },
  readMoreText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stageIconColumn: {
    width: 86,
    alignItems: 'center',
  },
  stageBadgeColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  stageBody: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  stageDescription: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  stageBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  stageBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginTop: 6,
  },
  previewSpacer: {
    height: 12,
  },
  profilePreview: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  profileCaption: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
});

export default LearnModuleDetailScreen;
