export type ManzurLocale = 'es' | 'en' | 'pt';

interface ManzurCopy {
  readonly tagline: string;
  readonly eyebrow: string;
  readonly heroLeading: string;
  readonly heroEmphasis: string;
  readonly heroDescription: string;
  readonly login: string;
  readonly getStarted: string;
  readonly explore: string;
  readonly featuresEyebrow: string;
  readonly featuresTitle: string;
  readonly featuresDescription: string;
  readonly scheduleTitle: string;
  readonly scheduleDescription: string;
  readonly attendanceTitle: string;
  readonly attendanceDescription: string;
  readonly progressTitle: string;
  readonly progressDescription: string;
  readonly communityEyebrow: string;
  readonly communityTitle: string;
  readonly communityDescription: string;
  readonly follow: string;
  readonly accountPrompt: string;
  readonly createAccount: string;
  readonly portal: string;
}

const copy: Readonly<Record<ManzurLocale, ManzurCopy>> = {
  es: {
    tagline: 'Artes marciales · Comunidad · Evolución', eyebrow: 'UNA MANERA DE ENTRENAR',
    heroLeading: 'Tu siguiente nivel', heroEmphasis: 'comienza aquí.',
    heroDescription: 'Cada entrenamiento suma. Organiza tus clases, sigue tu asistencia y mantén tu progreso a la vista, en un solo lugar.',
    login: 'Ingresar', getStarted: 'Crear mi cuenta', explore: 'Conoce la plataforma',
    featuresEyebrow: 'TU ENTRENAMIENTO, EN ORDEN', featuresTitle: 'Más enfoque en lo que importa.',
    featuresDescription: 'Una experiencia digital clara para alumnos e instructores, desde la primera clase hasta el siguiente desafío.',
    scheduleTitle: 'Clases a tu ritmo', scheduleDescription: 'Consulta tus clases y mantén tu semana organizada.',
    attendanceTitle: 'Presente en cada paso', attendanceDescription: 'Registra y revisa tu asistencia sin complicaciones.',
    progressTitle: 'Evolución visible', progressDescription: 'Sigue tu camino de entrenamiento con información accesible.',
    communityEyebrow: 'NOS MUEVE EL ENTRENAMIENTO', communityTitle: 'La constancia construye comunidad.',
    communityDescription: 'Conéctate con Manzur Bros y mantente al día con la experiencia de tu academia.',
    follow: 'Ver Instagram', accountPrompt: '¿Ya formas parte de la comunidad?', createAccount: 'Registrarme',
    portal: 'Acceso a alumnos',
  },
  en: {
    tagline: 'Martial arts · Community · Progress', eyebrow: 'A WAY TO TRAIN',
    heroLeading: 'Your next level', heroEmphasis: 'starts here.',
    heroDescription: 'Every training session counts. Organize classes, review attendance and track your progress in one place.',
    login: 'Sign in', getStarted: 'Create an account', explore: 'Explore the platform',
    featuresEyebrow: 'YOUR TRAINING, ORGANIZED', featuresTitle: 'Focus on what matters.',
    featuresDescription: 'A clear digital experience for students and instructors, from the first class to the next challenge.',
    scheduleTitle: 'Classes on your schedule', scheduleDescription: 'See your classes and keep your week organized.',
    attendanceTitle: 'Every step counts', attendanceDescription: 'Record and review attendance easily.',
    progressTitle: 'Visible progress', progressDescription: 'Follow your training journey with accessible information.',
    communityEyebrow: 'DRIVEN BY TRAINING', communityTitle: 'Consistency builds community.',
    communityDescription: 'Connect with Manzur Bros and stay close to your academy.',
    follow: 'Visit Instagram', accountPrompt: 'Already part of the community?', createAccount: 'Register',
    portal: 'Student access',
  },
  pt: {
    tagline: 'Artes marciais · Comunidade · Evolução', eyebrow: 'UMA FORMA DE TREINAR',
    heroLeading: 'Seu próximo nível', heroEmphasis: 'começa aqui.',
    heroDescription: 'Cada treino conta. Organize suas aulas, acompanhe a presença e veja seu progresso em um só lugar.',
    login: 'Entrar', getStarted: 'Criar conta', explore: 'Conhecer a plataforma',
    featuresEyebrow: 'SEU TREINO, ORGANIZADO', featuresTitle: 'Mais foco no que importa.',
    featuresDescription: 'Uma experiência digital clara para alunos e instrutores, da primeira aula ao próximo desafio.',
    scheduleTitle: 'Aulas no seu ritmo', scheduleDescription: 'Consulte suas aulas e organize sua semana.',
    attendanceTitle: 'Cada passo conta', attendanceDescription: 'Registre e consulte sua presença com facilidade.',
    progressTitle: 'Evolução visível', progressDescription: 'Acompanhe sua jornada com informações acessíveis.',
    communityEyebrow: 'MOVIDOS PELO TREINO', communityTitle: 'A constância constrói comunidade.',
    communityDescription: 'Conecte-se com Manzur Bros e acompanhe sua academia.',
    follow: 'Ver Instagram', accountPrompt: 'Já faz parte da comunidade?', createAccount: 'Cadastrar',
    portal: 'Acesso de alunos',
  },
};

/** Language detection is permissive; unknown locales intentionally use Spanish. */
export function getManzurCopy(language: string | undefined): ManzurCopy {
  const locale = language?.split('-')[0]?.toLowerCase();
  if (locale === 'en' || locale === 'pt') return copy[locale];
  return copy.es;
}
