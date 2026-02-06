import pandas as pd
import os
from datetime import datetime

def generate_medical_excel(structured_data, output_path="outputs"):
    if not os.path.exists(output_path):
        os.makedirs(output_path)

    # 1. Prepare DataFrames
    patient_info = structured_data.get("patient_info", {})
    patient_df = pd.DataFrame([patient_info])

    abnormal_list = structured_data.get("abnormal", [])
    abnormal_df = pd.DataFrame(abnormal_list)

    # 2. File Naming with Timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    patient_name = patient_info.get("name", "Unknown").replace(" ", "_")
    file_name = f"Analysis_{patient_name}_{timestamp}.xlsx"
    full_path = os.path.join(output_path, file_name)

    # 3. Write to Excel with multiple sheets
    with pd.ExcelWriter(full_path, engine='openpyxl') as writer:
        patient_df.to_excel(writer, sheet_name='Patient_Summary', index=False)
        abnormal_df.to_excel(writer, sheet_name='Critical_Findings', index=False)
        
        # Auto-adjust column widths for readability
        for sheetname in writer.sheets:
            worksheet = writer.sheets[sheetname]
            for col in worksheet.columns:
                max_length = 0
                column = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except: pass
                worksheet.column_dimensions[column].width = max_length + 2

    return full_path

