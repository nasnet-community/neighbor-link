#!/bin/bash

# Check if the input file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <input_file>"
  exit 1
fi

input_file="$1"
output_file="output.csv"

# Initialize variables
counter=0
line_buffer=""
index=0

# Process the input file
while IFS= read -r line
do
  # Add the line to the buffer
  if [ $counter -eq 0 ]; then
    line_buffer="$line"
  else
    line_buffer="$line_buffer,$line"
  fi
  
  # Increment the counter
  counter=$((counter + 1))

  # If 100 lines are read, write to output file
  if [ $counter -eq 60 ]; then

    index=$((index + 1))
    echo "config rule 'ir_ip$index'" >> "$output_file"
    echo "  option dest_ip '$line_buffer'" >> "$output_file"      
    echo "  option use_policy 'wan_only'" >> "$output_file"
    echo "  option family 'ipv4'" >> "$output_file"
    echo "" >> "$output_file"
    # Reset counter and buffer
    counter=0
    line_buffer=""

  fi
done < "$input_file"

# Write any remaining lines in the buffer to the output file
if [ $counter -ne 0 ]; then
    index=$((index + 1))
    echo "config rule 'ir_ip$index'" >> "$output_file"
    echo "  option dest_ip '$line_buffer'" >> "$output_file"      
    echo "  option use_policy 'wan_only'" >> "$output_file"
    echo "  option family 'ipv4'" >> "$output_file"
    echo "" >> "$output_file"
fi

echo "Processing complete. Output written to $output_file."
