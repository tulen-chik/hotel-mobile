import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FAQItem = {
  question: string;
  answer: string;
};

const faqItems: FAQItem[] = [
  {
    question: 'Как добавить новую комнату?',
    answer: 'Для добавления новой комнаты перейдите в раздел "Комнаты" и нажмите кнопку "+". Заполните необходимую информацию о комнате и сохраните изменения.',
  },
  {
    question: 'Как назначить уборку?',
    answer: 'В разделе "Уборка" выберите комнату, нажмите на кнопку "Назначить уборку" и выберите уборщика из списка доступных сотрудников.',
  },
  {
    question: 'Как изменить статус уборки?',
    answer: 'В разделе "Уборка" найдите нужную комнату и нажмите на текущий статус. Выберите новый статус из выпадающего списка.',
  },
  {
    question: 'Как добавить нового сотрудника?',
    answer: 'В разделе "Сотрудники" нажмите кнопку "+" и заполните форму с информацией о новом сотруднике. Не забудьте указать роль и контактные данные.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const handleSupportPress = () => {
    Linking.openURL('mailto:support@example.com');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Помощь</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Часто задаваемые вопросы</Text>
          {faqItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => setExpandedItem(expandedItem === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.question}>{item.question}</Text>
                <Ionicons
                  name={expandedItem === index ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#666"
                />
              </View>
              {expandedItem === index && (
                <Text style={styles.answer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Связаться с поддержкой</Text>
          <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress}>
            <Ionicons name="mail-outline" size={24} color="#fff" />
            <Text style={styles.supportButtonText}>Написать в поддержку</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  answer: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 