'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trackFacebookEvent } from '@/components/FacebookPixel';

interface AssessmentAnswers {
  [key: string]: string;
}

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
}

export default function AssessmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [userData, setUserData] = useState<UserData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 17; // 14 questions + 3 data collection steps

  const questions = [
    {
      id: 'q1',
      type: 'single',
      question: "What's your age range?",
      subtitle: 'Helps personalize your results',
      options: ['18–24', '25–34', '35–44', '45–54', '55+'],
      why: 'Performance and circulation support needs can change with age. Your results will be tailored to your age group.',
    },
    {
      id: 'q2',
      type: 'single',
      question: 'What brought you here today?',
      subtitle: 'Which feels most true right now?',
      options: [
        'I want to stay ahead of performance changes before they get worse',
        'My confidence has dropped and I want it back',
        'I want more consistency and reliability',
        'I feel stress or pressure is affecting me',
        "I'm just curious and want to understand what's going on",
      ],
      note: 'Many men start here. In most cases, the best improvements come from small daily changes + the right support (not extreme treatments).',
    },
    {
      id: 'name',
      type: 'text',
      question: "What's your first name?",
      subtitle: 'We use this to personalize your results',
      placeholder: 'Enter your first name',
    },
    {
      id: 'q3',
      type: 'single',
      question: 'How confident do you feel *before* intimacy?',
      subtitle: 'Confidence going into intimate moments',
      options: [
        'Very confident — rarely concerned',
        'Mostly confident, but I sometimes overthink it',
        'Confidence has noticeably dropped',
        'I often worry about disappointing my partner (or myself)',
      ],
      note: 'Confidence and performance are connected. The goal is to feel calm, prepared, and reliable — not "perfect".',
    },
    {
      id: 'q4',
      type: 'single',
      question: 'How consistent has your performance felt recently?',
      subtitle: 'Consistency over the last 30–60 days',
      options: [
        'Very consistent and reliable',
        'Mostly consistent with a few off days',
        'Inconsistent — some good moments, some frustrating ones',
        'Often unpredictable and it affects my confidence',
      ],
      note: 'Inconsistency is common — and for many men it\'s linked to lifestyle + circulation support, not "something wrong" with them.',
    },
    {
      id: 'q5',
      type: 'single',
      question: 'Have performance concerns affected your relationship or connection?',
      subtitle: 'Relationship impact',
      options: [
        'Not at all',
        "A little — it's crossed my mind",
        "Yes — it's created stress or tension",
        "Yes — it's been a major source of frustration or self-doubt",
      ],
      note: "Fixing this isn't only physical — it's emotional too. Feeling in control again changes everything.",
    },
    {
      id: 'email',
      type: 'email',
      question: "What's your email address?",
      subtitle: 'We\'ll send your personalized results here',
      placeholder: 'Enter your email',
    },
    {
      id: 'q6',
      type: 'single',
      question: 'How often do you wake up feeling "ready" in the morning?',
      subtitle: 'Morning readiness (wellness signal)',
      options: ['Most mornings', 'A few times per week', 'Rarely', 'Almost never'],
      note: 'Morning readiness can reflect recovery, stress balance, and circulation support.',
    },
    {
      id: 'q7',
      type: 'single',
      question: 'How often do stress, pressure, or anxiety affect how you feel physically?',
      subtitle: 'Stress & mental load',
      options: [
        'Rarely — I manage stress well',
        'Occasionally',
        'Often',
        'Almost daily',
      ],
      note: 'Stress management + the right daily nutrients can help restore balance without anything extreme or expensive.',
    },
    {
      id: 'q8',
      type: 'single',
      question: 'How would you describe your sleep most nights?',
      subtitle: 'Sleep quality',
      options: [
        'Deep and consistent',
        'Decent but interrupted',
        'Restless / light sleep',
        'Poor sleep most nights',
      ],
      note: 'Better recovery often leads to better performance. Many men see improvements just by improving sleep + adding simple daily support.',
    },
    {
      id: 'q9',
      type: 'single',
      question: 'How active are you during the week?',
      subtitle: 'Activity level (blood flow + stamina support)',
      options: [
        'Very active (4+ days/week)',
        'Moderately active (2–3 days/week)',
        'Light activity (1 day/week)',
        'Mostly sedentary',
      ],
      note: "You don't need intense workouts. Even light, consistent movement supports circulation and confidence over time.",
    },
    {
      id: 'q10',
      type: 'single',
      question: 'Do you smoke or vape?',
      subtitle: 'Smoking / vaping habits (important)',
      options: ['No', 'Occasionally', 'Yes (daily)', 'I used to, but quit'],
      note: 'Smoking/vaping can impact circulation. The right habit changes + support can make a noticeable difference for many men.',
    },
    {
      id: 'q11',
      type: 'single',
      question: 'How often do you drink alcohol?',
      subtitle: 'Alcohol frequency',
      options: ['Rarely / never', '1–2x per week', '3–5x per week', 'Daily'],
      note: 'Alcohol can affect recovery and performance. Many men improve results by adjusting intake + supporting recovery.',
    },
    {
      id: 'q12',
      type: 'single',
      question: 'What have you tried to improve confidence/performance?',
      subtitle: 'What have you tried already?',
      options: [
        "Nothing yet — I'm looking for a real plan",
        'Lifestyle changes (sleep, workouts, diet)',
        'Random supplements (inconsistent results)',
        'Prescription options',
        "A mix of things, but nothing 'stuck'",
      ],
      note: "You don't need expensive clinics or complicated protocols. What works best is a simple system you can actually follow.",
    },
    {
      id: 'phone',
      type: 'tel',
      question: "What's your phone number?",
      subtitle: 'We may call to discuss your personalized plan',
      placeholder: 'Enter your phone number',
    },
    {
      id: 'q13',
      type: 'single',
      question: 'If one area improved in the next 30–90 days, what would matter most?',
      subtitle: 'What matters most if you could improve one thing?',
      options: [
        'Stronger confidence',
        'More consistency and reliability',
        'Better energy and drive',
        'Better connection with my partner',
        'Less stress and overthinking',
      ],
      note: 'The best plan is usually a combination of lifestyle + daily support that targets the root (circulation, recovery, stress).',
    },
    {
      id: 'q14',
      type: 'single',
      question: 'If there were a natural option designed to support circulation, energy, and male vitality as part of a daily routine, how interested would you be?',
      subtitle: 'Openness to a natural support option',
      options: [
        'Very interested — I want something that actually makes sense',
        "Interested — I'm open to trying the right approach",
        'Slightly interested — depends on what it is',
        'Just browsing right now',
      ],
      note: "This doesn't have to be extreme or expensive. Most men prefer something simple, private, and consistent.",
    },
    {
      id: 'ready',
      type: 'single',
      question: 'Are you ready to start something that will begin working now?',
      subtitle: 'Ready to take action?',
      options: [
        'Yes, I want to start today',
        'Yes, but I want to see my results first',
        'Maybe, I need more information',
        'Not right now',
      ],
    },
  ];

  const handleAnswer = (value: string) => {
    const currentQuestion = questions[currentStep];
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // Save user data separately
    if (currentQuestion.id === 'name') {
      setUserData((prev) => ({ ...prev, name: value }));
    } else if (currentQuestion.id === 'email') {
      setUserData((prev) => ({ ...prev, email: value }));
    } else if (currentQuestion.id === 'phone') {
      setUserData((prev) => ({ ...prev, phone: value }));
    }

    // Auto-advance for single choice questions
    if (currentQuestion.type === 'single') {
      setTimeout(() => {
        if (currentStep < questions.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          handleComplete();
        }
      }, 300);
    }
  };

  const saveLead = async (name: string, email: string, phone?: string) => {
    // Only save if we have both name and email
    if (!name || !email) return;

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: name,
          lastName: '',
          email: email,
          phone: phone || '',
          assessmentData: answers, // Include any answers collected so far
        }),
      });

      // Track Facebook Lead event
      trackFacebookEvent('Lead', {
        content_name: 'Assessment Lead',
        email: email,
        first_name: name,
        last_name: '',
        phone_number: phone || '',
      });
    } catch (error) {
      console.error('Error saving lead:', error);
      // Don't block user flow if lead save fails
    }
  };

  const handleTextInput = (value: string) => {
    const currentQuestion = questions[currentStep];
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    let updatedUserData = { ...userData };
    
    if (currentQuestion.id === 'name') {
      updatedUserData = { ...updatedUserData, name: value };
      setUserData(updatedUserData);
    } else if (currentQuestion.id === 'email') {
      updatedUserData = { ...updatedUserData, email: value };
      setUserData(updatedUserData);
      // Save lead immediately when email is entered (if we have name)
      if (updatedUserData.name && value) {
        saveLead(updatedUserData.name, value, updatedUserData.phone);
      }
    } else if (currentQuestion.id === 'phone') {
      updatedUserData = { ...updatedUserData, phone: value };
      setUserData(updatedUserData);
      // Save lead if we have name and email
      if (updatedUserData.name && updatedUserData.email) {
        saveLead(updatedUserData.name, updatedUserData.email, value);
      }
    }
  };

  const handleNext = () => {
    // Save lead if we have name and email before moving to next step
    const currentQuestion = questions[currentStep];
    if (currentQuestion.id === 'email' && userData.name && answers[currentQuestion.id]) {
      saveLead(userData.name, answers[currentQuestion.id], userData.phone);
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    // Save lead data if we have email
    if (userData.email && userData.name) {
      try {
        await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: userData.name,
            lastName: '',
            email: userData.email,
            phone: userData.phone || '',
            assessmentData: answers,
          }),
        });
      } catch (error) {
        console.error('Error saving lead:', error);
      }
    }

    // Navigate to results page with answers
    const resultsParams = new URLSearchParams({
      ...answers,
      ...userData,
    }).toString();
    router.push(`/assessment/results?${resultsParams}`);
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const stepNumber = currentStep + 1;

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header with Progress */}
      <div className="w-full bg-[#2a2a2a] border-b border-[#3a3a3a] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </button>
            <span className="text-sm text-gray-400">
              {String(stepNumber).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3">
          <div className="w-full bg-[#3a3a3a] rounded-full h-1.5">
            <div
              className="bg-[#0D6B4D] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
            {currentQuestion.question}
          </h1>
          {currentQuestion.subtitle && (
            <p className="text-gray-400 text-center mb-8 text-lg">{currentQuestion.subtitle}</p>
          )}

          {/* Question Content */}
          <div className="mt-8">
            {currentQuestion.type === 'single' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      answers[currentQuestion.id] === option
                        ? 'bg-[#0D6B4D] border-[#0D6B4D] text-white'
                        : 'bg-[#2a2a2a] border-[#3a3a3a] text-white hover:border-[#0D6B4D]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base md:text-lg">{option}</span>
                      {answers[currentQuestion.id] === option && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {(currentQuestion.type === 'text' || currentQuestion.type === 'email' || currentQuestion.type === 'tel') && (
              <div className="space-y-4">
                <input
                  type={currentQuestion.type}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleTextInput(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full px-4 py-4 bg-[#2a2a2a] border-2 border-[#3a3a3a] rounded-xl text-white text-lg focus:outline-none focus:border-[#0D6B4D] transition-colors"
                />
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className="w-full bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            )}
          </div>

          {/* Why/Note Section */}
          {(currentQuestion.why || currentQuestion.note) && (
            <div className="mt-8 p-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl">
              <p className="text-sm text-gray-400 leading-relaxed">
                <strong className="text-[#0D6B4D]">Good to know:</strong> {currentQuestion.why || currentQuestion.note}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="w-full bg-[#2a2a2a] border-t border-[#3a3a3a] px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-500 text-center">
            By proceeding further, you agree to our{' '}
            <a href="/terms" className="text-[#0D6B4D] hover:underline">
              Terms of Use
            </a>
            ,{' '}
            <a href="/privacy" className="text-[#0D6B4D] hover:underline">
              Privacy Policy
            </a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#0D6B4D] hover:underline">
              Cookie Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
