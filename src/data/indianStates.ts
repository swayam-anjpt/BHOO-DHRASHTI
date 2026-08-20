export interface IndianState {
  name: string;
  code: string;
  type: 'State' | 'Union Territory';
  capital: string;
  primaryLanguage: string;
}

export const INDIAN_STATES: IndianState[] = [
  { name: 'Andhra Pradesh', code: 'AP', type: 'State', capital: 'Amaravati', primaryLanguage: 'Telugu' },
  { name: 'Arunachal Pradesh', code: 'AR', type: 'State', capital: 'Itanagar', primaryLanguage: 'English' },
  { name: 'Assam', code: 'AS', type: 'State', capital: 'Dispur', primaryLanguage: 'Assamese' },
  { name: 'Bihar', code: 'BR', type: 'State', capital: 'Patna', primaryLanguage: 'Hindi' },
  { name: 'Chhattisgarh', code: 'CG', type: 'State', capital: 'Raipur', primaryLanguage: 'Chhattisgarhi' },
  { name: 'Goa', code: 'GA', type: 'State', capital: 'Panaji', primaryLanguage: 'Konkani' },
  { name: 'Gujarat', code: 'GJ', type: 'State', capital: 'Gandhinagar', primaryLanguage: 'Gujarati' },
  { name: 'Haryana', code: 'HR', type: 'State', capital: 'Chandigarh', primaryLanguage: 'Hindi' },
  { name: 'Himachal Pradesh', code: 'HP', type: 'State', capital: 'Shimla', primaryLanguage: 'Hindi' },
  { name: 'Jharkhand', code: 'JH', type: 'State', capital: 'Ranchi', primaryLanguage: 'Hindi' },
  { name: 'Karnataka', code: 'KA', type: 'State', capital: 'Bengaluru', primaryLanguage: 'Kannada' },
  { name: 'Kerala', code: 'KL', type: 'State', capital: 'Thiruvananthapuram', primaryLanguage: 'Malayalam' },
  { name: 'Madhya Pradesh', code: 'MP', type: 'State', capital: 'Bhopal', primaryLanguage: 'Hindi' },
  { name: 'Maharashtra', code: 'MH', type: 'State', capital: 'Mumbai', primaryLanguage: 'Marathi' },
  { name: 'Manipur', code: 'MN', type: 'State', capital: 'Imphal', primaryLanguage: 'Manipuri' },
  { name: 'Meghalaya', code: 'ML', type: 'State', capital: 'Shillong', primaryLanguage: 'English' },
  { name: 'Mizoram', code: 'MZ', type: 'State', capital: 'Aizawl', primaryLanguage: 'Mizo' },
  { name: 'Nagaland', code: 'NL', type: 'State', capital: 'Kohima', primaryLanguage: 'English' },
  { name: 'Odisha', code: 'OD', type: 'State', capital: 'Bhubaneswar', primaryLanguage: 'Odia' },
  { name: 'Punjab', code: 'PB', type: 'State', capital: 'Chandigarh', primaryLanguage: 'Punjabi' },
  { name: 'Rajasthan', code: 'RJ', type: 'State', capital: 'Jaipur', primaryLanguage: 'Hindi' },
  { name: 'Sikkim', code: 'SK', type: 'State', capital: 'Gangtok', primaryLanguage: 'Nepali' },
  { name: 'Tamil Nadu', code: 'TN', type: 'State', capital: 'Chennai', primaryLanguage: 'Tamil' },
  { name: 'Telangana', code: 'TG', type: 'State', capital: 'Hyderabad', primaryLanguage: 'Telugu' },
  { name: 'Tripura', code: 'TR', type: 'State', capital: 'Agartala', primaryLanguage: 'Bengali' },
  { name: 'Uttar Pradesh', code: 'UP', type: 'State', capital: 'Lucknow', primaryLanguage: 'Hindi' },
  { name: 'Uttarakhand', code: 'UK', type: 'State', capital: 'Dehradun', primaryLanguage: 'Hindi' },
  { name: 'West Bengal', code: 'WB', type: 'State', capital: 'Kolkata', primaryLanguage: 'Bengali' },
  // Union Territories
  { name: 'Andaman and Nicobar Islands', code: 'AN', type: 'Union Territory', capital: 'Port Blair', primaryLanguage: 'Hindi' },
  { name: 'Chandigarh', code: 'CH', type: 'Union Territory', capital: 'Chandigarh', primaryLanguage: 'Hindi' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN', type: 'Union Territory', capital: 'Daman', primaryLanguage: 'Gujarati' },
  { name: 'Delhi (National Capital Territory)', code: 'DL', type: 'Union Territory', capital: 'New Delhi', primaryLanguage: 'Hindi' },
  { name: 'Jammu and Kashmir', code: 'JK', type: 'Union Territory', capital: 'Srinagar / Jammu', primaryLanguage: 'Urdu' },
  { name: 'Ladakh', code: 'LA', type: 'Union Territory', capital: 'Leh', primaryLanguage: 'Ladakhi' },
  { name: 'Lakshadweep', code: 'LD', type: 'Union Territory', capital: 'Kavaratti', primaryLanguage: 'Malayalam' },
  { name: 'Puducherry', code: 'PY', type: 'Union Territory', capital: 'Puducherry', primaryLanguage: 'Tamil' },
];
