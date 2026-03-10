import React from 'react';
import { useAppForm } from './src/hooks/form';
export function Test() {
  const form = useAppForm({ defaultValues: { a: 1 } });
  return <form.AppField name="a">{field => <field.TextField label="Test" />}</form.AppField>;
}
