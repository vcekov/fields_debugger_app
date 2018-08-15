const eyeSVG =
  `<svg viewBox="0 0 16 16" id="zd-svg-icon-16-eye-fill" width="100%" height="100%">
      <g fill="currentColor">
        <path d="M15.83 7.42C15.1 6.38 12.38 3 8 3S.9 6.38.17 7.42a.99.99 0 0 0 0 1.16C.9 9.62 3.62 13 8
                13s7.1-3.38 7.83-4.42a.99.99 0 0 0 0-1.16zM8 11c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z">
        </path>
        <circle cx="8" cy="8" r="2"></circle>
      </g>
    </svg>`;

const client = opener.client;

let fieldsManager;
let optionManager;
let optionValuesManager;
let optionGroupsManager;

class FieldsManager {
  async getFields() {
    const { ticketFields } = await client.get('ticketFields');
    this.fields = ticketFields;
    this.buildAllFields();
  }

  renderAllFields(fields) {
    return `
      <div class="options-title">Fields</div>
      <table class="fields-table">
        ${fields.map(this.renderField, this).join('')}
      </table>`;
  }

  renderField(field) {
    const name = field.name;
    return `
      <tr id="${name}">
        <td class="name">${name}</td>
        <td class="label"><span contenteditable=true oninput="fieldsManager.onLabelChange('${name}', this.innerHTML)">${field.label}</span></td>
        <td class="disabler"><div class="circle ${field.isEnabled ? 'enabled' : 'disabled'}" onclick="fieldsManager.toggleEnable('${name}', this)"></div></td>
        <td class="hider"><div class="eye ${field.isVisible ? 'visible' : 'hidden'}" onclick="fieldsManager.toggleVisibility('${name}', this)">${eyeSVG}</div></td>
        <td>
          <div class="option-buttons ${field.hasOptions ? 'has-options' : 'no-options'}">
            <button onclick="fieldsManager.showOptionsFor('${name}', '${field.label}')">O</button>
            <button onclick="fieldsManager.showOptionValuesFor('${name}', '${field.label}')">OValues</button>
            <button onclick="fieldsManager.showOptionGroupsFor('${name}', '${field.label}')">OGroups</button>
          </div>
        </td>
      </tr>
    `;
  }

  showOptionsFor(fieldName, fieldLabel) {
    optionManager.getOptionsForAField(fieldName, fieldLabel);
  }
  showOptionValuesFor(fieldName, fieldLabel) {
    optionValuesManager.getOptionsForAField(fieldName, fieldLabel);
  }
  showOptionGroupsFor(fieldName, fieldLabel) {
    optionGroupsManager.getOptionsForAField(fieldName, fieldLabel);
  }

  onLabelChange(fieldName, value) {
    client.set(`ticketFields:${fieldName}.label`, value);
  }

  async toggleEnable(fieldName, el) {
    const isEnabledKey = `ticketFields:${fieldName}.isEnabled`;
    let isEnabled = (await client.get(isEnabledKey))[isEnabledKey];
    const command = isEnabled ? 'disable' : 'enable';
    await client.invoke(`ticketFields:${fieldName}.${command}`);
    isEnabled = (await client.get(isEnabledKey))[isEnabledKey];
    el.classList.remove('disabled');
    el.classList.remove('enabled');
    el.classList.add(isEnabled ? 'enabled' : 'disabled');
  }

  async toggleVisibility(fieldName, el) {
    const isVisibleKey = `ticketFields:${fieldName}.isVisible`;
    let isVisible = (await client.get(isVisibleKey))[isVisibleKey];
    const command = isVisible ? 'hide' : 'show';
    await client.invoke(`ticketFields:${fieldName}.${command}`);
    isVisible = (await client.get(isVisibleKey))[isVisibleKey];
    el.classList.remove('hidden');
    el.classList.remove('visible');
    el.classList.add(isVisible ? 'visible' : 'hidden');
  }

  buildAllFields() {
    const systemFields = this.fields.filter(field => field.type === 'built-in');
    const customFields = this.fields.filter(field => field.type !== 'built-in');
    const allFields = [...systemFields, ...customFields];
    document.getElementById('el_fields').innerHTML = this.renderAllFields(allFields);
  }
}

fieldsManager = new FieldsManager();
fieldsManager.getFields();

// ---------------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------------

class OptionManager {
  constructor(key = 'options', globalManagerName = 'optionManager') {
    this.key = key;
    this.name = globalManagerName;
  }

  async getOptionsForAField(fieldName, fieldLabel) {
    this.fieldName = fieldName;
    this.fieldLabel = fieldLabel;
    const data = await client.get(`ticketFields:${this.fieldName}.${this.key}`);
    this.buildAllOptions(data[`ticketFields:${this.fieldName}.${this.key}`]);
  }

  buildAllOptions(options) {
    document.getElementById('el_fields_options').innerHTML = this.renderOptionsFor(options);
  }

  renderOption(option, index) {
    return `
      <tr>
        <td class="name">${option.value}</td>
        <td class="label"><span contenteditable=true oninput="${this.name}.onOptionLabelChange(${index}, this.innerHTML)">${option.label}</span></td>
        <td class="disabler"><div class="circle ${option.isEnabled ? 'enabled' : 'disabled'}" onclick="${this.name}.toggleOptionEnable(${index}, this)"></div></td>
        <td class="hider"><div class="eye ${option.isVisible ? 'visible' : 'hidden'}" onclick="${this.name}.toggleOptionVisibility(${index}, this)">${eyeSVG}</div></td>
      </tr>
    `;
  }

  renderOptionsFor(options) {
    if (options.length === 0) return 'No options';
    return `
      <div class="options-title">${this.fieldLabel}</div>
      <div class="options-subtitle">${this.key} for: <b>${this.fieldName}</b></div>
      <table class="options-table">
        ${options.map((option, index) => this.renderOption(option, index)).join('')}
      </table>`;
  }

  async onOptionLabelChange(index, value) {
    const data = await client.set(`ticketFields:${this.fieldName}.${this.key}.${index}.label`, value);
  }

  async toggleOptionEnable(index, el) {
    const isEnabledKey = `ticketFields:${this.fieldName}.${this.key}.${index}.isEnabled`;
    const data = await client.get(isEnabledKey);
    let isEnabled = (await client.get(isEnabledKey))[isEnabledKey];
    const command = isEnabled ? 'disable' : 'enable';
    await client.invoke(`ticketFields:${this.fieldName}.${this.key}.${index}.${command}`);
    isEnabled = (await client.get(isEnabledKey))[isEnabledKey];
    el.classList.remove('disabled');
    el.classList.remove('enabled');
    el.classList.add(isEnabled ? 'enabled' : 'disabled');
  }

  async toggleOptionVisibility(index, el) {
    const isVisibleKey = `ticketFields:${this.fieldName}.${this.key}.${index}.isVisible`;
    let isVisible = (await client.get(isVisibleKey))[isVisibleKey];
    const command = isVisible ? 'hide' : 'show';
    await client.invoke(`ticketFields:${this.fieldName}.${this.key}.${index}.${command}`);
    isVisible = (await client.get(isVisibleKey))[isVisibleKey];
    el.classList.remove('hidden');
    el.classList.remove('visible');
    el.classList.add(isVisible ? 'visible' : 'hidden');
  }
}

optionManager = new OptionManager('options', 'optionManager');
optionValuesManager = new OptionManager('optionValues', 'optionValuesManager');
optionGroupsManager = new OptionManager('optionGroups', 'optionGroupsManager');
