/*
  # Initial Schema Setup for LedgerBook

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `village_name` (text)
      - `contact_number` (text, nullable)
      - `outstanding_dues` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `amount` (numeric)
      - `type` (text) - 'DEBIT' or 'CREDIT'
      - `description` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  village_name text NOT NULL,
  contact_number text,
  outstanding_dues numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for customers table
CREATE POLICY "Users can manage their own customers"
  ON customers
  USING (auth.uid() = user_id);

-- Policies for transactions table
CREATE POLICY "Users can manage transactions for their customers"
  ON transactions
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = transactions.customer_id
      AND customers.user_id = auth.uid()
    )
  );