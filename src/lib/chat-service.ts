export async function getMockAIResponse(input: string): Promise<string> {
  const delay = 1000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const lower = input.toLowerCase();

  if (lower.includes('заявк')) {
    return "Чтобы создать заявку, перейдите в раздел 'Закупки' и нажмите кнопку 'Новая заявка'. Хотите, я создам черновик?";
  }

  if (lower.includes('поставщик')) {
    return 'Поиск поставщиков доступен в глобальном каталоге. Вы ищете конкретный товар или услугу?';
  }

  if (lower.includes('как это работает')) {
    return 'Project EXOS автоматизирует ваши закупки: от заявки до оплаты. С чего начнем?';
  }

  return 'Я пока учусь, но могу помочь найти нужный раздел меню. Что вы хотите сделать?';
}
