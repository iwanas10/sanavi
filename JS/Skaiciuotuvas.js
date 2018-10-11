(function() {
    'use strict';

    class BudgCalc {

        // Convert any interval income to yearly total
        normalizeIncome(income, recurance) {
            var rate = this.dateData[recurance.toUpperCase()];
            if (rate) return income * rate;
        }
        // Setup budget params and some interface variables to be used in templating throughout the experience
        initBudget(personFullName, afterTaxIncome, recurance) {

            const DAILY = 365;
            const WEEKLY = 52;
            const BIWEEKLY = 26;
            const MONTHLY = 12;
            const YEARLY = 1;

            this.name = personFullName;

            this.expensesAdded = false;

            this.stylesAdded = false;

            this.expenses = {
                daily: [],
                weekly: [],
                biweekly: [],
                monthly: [],
                yearly: []
            }

            // To be calculated at runtime
            this.incomeBreakdown = {
                daily: 0,
                weekly: 0,
                biweekly: 0,
                monthly: 0,
                yearly: 0
            }

            //  Constants storing occurances per year
            this.dateData = {
                DAILY: DAILY,
                WEEKLY: WEEKLY,
                BIWEEKLY: BIWEEKLY,
                MONTHLY: MONTHLY,
                YEARLY: YEARLY
            }

            this.income = this.normalizeIncome(this.dollarsToCents(afterTaxIncome), recurance);
            this.initialAfterTaxIncome = this.income;
            this.setAmountsAvailableByTimePeriod();

            return this;
        }

        // Dollars string to cents int
        dollarsToCents(curString) {
            var dolCentArr = curString.replace('$', '').replace(',', '').split('.'),
                dollarToCent = dolCentArr[0] * 100,
                origCents = dolCentArr[1] || 0, // For exact dollar amounts
                cents;

            if (origCents.length > 2) origCents = origCents.substring(0, 1); // Truncate anything larger than .00

            cents = (parseInt(dollarToCent, 10) + parseInt(origCents, 10)); // Avoid type coersion here!

            return Math.round(cents);
        }

        formatMoney(numString) {
            var numStringsArr = numString.replace(',', '').replace('$', '').split('.')[0].split(''),
                cents = numString.split('.')[1] || '00';
            for (var len = numStringsArr.length, limit = 0, trackby = -1; len > 0; --len) {
                trackby++;
                if (trackby === 3) {
                    numStringsArr.splice(len, 0, ',')
                    trackby = 0;
                }
            }

            if (cents.length === 1) cents += '0';
            return `$${numStringsArr.join('')}.${cents}`;
        }

        // Turns dollars int to formatted US currency string
        centsToDollars(centsInt) {

            var centsStr = `$${(parseInt(centsInt, 10) / 100)}`,
                formattedUSMoneyArr = centsStr.split('.'),
                dollarAmt = formattedUSMoneyArr[0],
                centsMember = Math.round(formattedUSMoneyArr[1]) || [],
                result;

            if (!centsMember.length) result = centsStr + '.00'; // Add back in string format when js truncates a whole number (trailing .00's)
            else switch (true) {
                case centsMember.length === 1:
                    result = centsStr + '0'; // Needs one more 0 to hold the tenths spot that was truncated by js
                    break;
                case centsMember.length === 2:
                    result = centsStr; // Ok format here just return
                    break;
                case centsMember.length > 2:
                    result = formattedUSMoneyArr[0] + '.' + centsMember.substring(0, 2).join('');
                    break; // Truncate larger than 99 cents
            }
            if (result) return this.formatMoney(result);
        }

        // Sets up the amounts available in time period
        setAmountsAvailableByTimePeriod() {
            this.incomeBreakdown.daily = this.centsToDollars(this.income / this.dateData.DAILY);
            this.incomeBreakdown.weekly = this.centsToDollars(this.income / this.dateData.WEEKLY);
            this.incomeBreakdown.biweekly = this.centsToDollars(this.income / this.dateData.BIWEEKLY);
            this.incomeBreakdown.monthly = this.centsToDollars(this.income / this.dateData.MONTHLY);
            this.incomeBreakdown.yearly = this.centsToDollars(this.income);
            return this;
        }

        setNewExpense(name, recurance, amount) {
            var bill = {},
                rate = this.dateData[recurance.toUpperCase()], // To match constant name
                matchingRecord = this.expenses[recurance];

            amount = this.dollarsToCents(amount);

            if (this.incomeBreakdown[recurance] && rate && matchingRecord && name && amount) {
                this.income = Math.round(this.income - (amount * rate));
                bill[name] = this.centsToDollars(amount);
                matchingRecord.push(bill);
                this.setAmountsAvailableByTimePeriod();
                this.expensesAdded = true;
            }

        }

        getFullReport() {
            return {
                expenses: this.expenses,
                budget: this.incomeBreakdown
            }
        }
    }

    class renderUI extends BudgCalc {
        init() {

            this.selectors = {

                info: {
                    root: '[data-info]',
                    name: '[data-name]',
                    salary: '[data-salary]',
                    next: '[data-next]',
                    logo: '[data-info-logo]',
                    recurance: '[data-income-recurance]'
                },

                expensesList: {
                    root: '[data-expenses-list]'
                },
                incomeList: {
                    root: '[data-income-list]'
                },
                add: {
                    root: '[data-add-expenses]',
                    expenseName: '[data-expense-name]',
                    expenseAmount: '[data-expense-amount]',
                    expenseRecuranceSelect: '[data-expense-recurance]',
                    add: '[data-add]',
                    delete: '[data-expense-delete]',
                    reset: '[data-reset]'
                }

            }
            this.templates = {

                moduleStyles: function() {
                    return `
						<link href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.1/animate.min.css" rel="stylesheet" type="text/css">
						<link href='https://fonts.googleapis.com/css?family=Raleway:500,700' rel='stylesheet' type='text/css'>
				    	<style></style>
					`;

                },

                bindInfoHeader: function(name, yearlyDollarIncome, runningIncomeYearlyRemainder) {
                    if (runningIncomeYearlyRemainder){
                        return `
								<ul class="budget-calc--general-info">
									<li><h1>Name: ${name}</li>
									<li><h1>Yearly After Tax Income: ${yearlyDollarIncome}</h1></li>
									<li><h1>Income with Expenses subtracted: ${yearlyDollarIncome}</h1></li>
								</ul>
								`;
                    }
                    else {
                        return `
								<ul class="budget-calc--general-info">
									<li><h1>Name: ${name}</li>
									<li><h1>Yearly After Tax Income: ${yearlyDollarIncome}</h1></li>
								</ul>
							`;
                    }
                },

                initialUI: function() {
                    var self = this;
                    return `
						<div class="budget-calc--container">
							<form action="javascript:return;" name="budget">
								<section class="budget-calc--info-view" data-info>
									<img data-info-logo src="http://static1.squarespace.com/static/523a1f7ae4b098f0cba7b255/t/526eb264e4b01dab45fe9f75/1382986340886/allocate+optimally.png">
									<h1 class="budget-calc--main-title">Įveskite savo vardą ir gaunamas pajamas</h1>
									<input required class="budget-calc--input" placeholder="Jūsų vardas" data-name id="name" type="text">
									<input required class="budget-calc--input" placeholder="Jūsų pajamos" data-salary id="salary" type="text">
									<select required class="budget-calc--select" id="income_recurance" data-income-recurance>
										<option value="daily">Dienos</option>
										<option value="weekly">Savaitės</option>
										<option value="biweekly" selected>Dviejų-Savaičiu</option>											
										<option value="monthly">Mėnesio</option>
										<option value="yearly" selected>Metų</option>
									</select>
									<button class="budget-calc--action" data-next>Kitas</button>
								</section>
								<section class="budget-calc--add-expenses-view" data-add-expenses>
									<input required class="budget-calc--input" placeholder="Expense name" id="expense_name" data-expense-name type="text">
									<input required class="budget-calc--input" placeholder="Expense amount" id="expense_amount" data-expense-amount type="text">
									<select required class="budget-calc--select" id="expense_recurance" data-expense-recurance>
																	<option value="daily">Daily</option>
																	<option value="weekly">Weekly</option>
																	<option value="biweekly">Bi-weekly</option>											
																	<option value="monthly" selected>Monthly</option>
																	<option value="yearly">Yearly</option>
																</select>
									<button class="budget-calc--reset" data-reset>Reset</button>
									<button class="budget-calc--action" data-add>Add expense</button>
								</section>
							</form>
							<section class="budget-calc--income-list-view" data-income-list>income list</section>
							<section class="budget-calc--expenses-list-view" data-expenses-list></section>
						</div>
						`;
                }

            }
            return this;
        }

        hideElm(node) {
            node.setAttribute('style', 'display: none;');
            return this;
        }

        showElm(node) {
            node.setAttribute('style', '');
            return this;
        }

        getNodes(selector) {
            return [].slice.call(document.querySelectorAll(selector));
        }

        each(obj, fn, condition) {
            if (!condition) for (var key in obj) if (obj.hasOwnProperty(key)) fn(obj[key], key);
            else for (var key in obj) if (obj.hasOwnProperty(key) && condition) fn(obj[key], key);
            return this;
        }

        addExpense(nameStr, recuranceStr, amountStr) {
            // UI stuff in here
            this.setNewExpense(nameStr, recuranceStr, amountStr);
        }

        applyDOMHooks() {
            this.addExpensesStage = this.getNodes(this.selectors.add.root)[0];
            this.infoStage = this.getNodes(this.selectors.info.root)[0];
            this.incomeRecurance = this.getNodes(this.selectors.info.recurance)[0];
            this.nextBtn = this.getNodes(this.selectors.info.next)[0];
            this.logo = this.getNodes(this.selectors.info.logo)[0];
            this.incomeList = this.getNodes(this.selectors.incomeList.root)[0];
            this.expensesList = this.getNodes(this.selectors.expensesList.root)[0];
            this.nameField = this.getNodes(this.selectors.info.name)[0];
            this.salaryField = this.getNodes(this.selectors.info.salary)[0];
            this.expenseName = this.getNodes(this.selectors.add.expenseName)[0];
            this.expenseAmount = this.getNodes(this.selectors.add.expenseAmount)[0];
            this.expenseRecurance = this.getNodes(this.selectors.add.expenseRecuranceSelect)[0];
            this.addExpenseBtn = this.getNodes(this.selectors.add.add)[0];
            this.reset = this.getNodes(this.selectors.add.reset)[0];
            return this;
        }

        formatUserInput(formatter) {
            if (this.value && this.value.trim() !== '' && this.value.trim() !== '.') return formatter(this.value);
            else return '';
        }

        setInitialView() {
            var self = this,
                value;

            this.hideElm(this.incomeList);
            this.hideElm(this.addExpensesStage);
            this.hideElm(this.expensesList);

            function initializeNewInstance() {
                new renderUI().init().create(self.targetSelector).bindInitialUI();
            }

            function collectInitialData() {
                if (self.nameField.value && self.salaryField.value) self.progressToExpenseCollection();
            }

            this.reset.addEventListener('click', initializeNewInstance);

            this.salaryField.addEventListener('blur', function() {
                var field = this;

                this.value = self.formatUserInput.call(field, self.formatMoney);
            });

            this.nextBtn.addEventListener('click', collectInitialData);

            return this;
        }

        progressToExpenseCollection() {
            var self = this;

            self.expenseAmount.addEventListener('blur', function() {
                var field = this;
                this.value = self.formatUserInput.call(field, self.formatMoney);
            });

            self.initBudget(self.nameField.value, self.salaryField.value, self.incomeRecurance.value);
            // Default data calced by salary with no expenses, reused each time there is an expense added
            self.renderData();
            // Once the next button is clicked hide the info collection
            self.infoStage.innerHTML = self.templates.bindInfoHeader(self.name, self.centsToDollars(self.income));
            // self.hideElm(self.infoStage);
            self.showElm(self.incomeList);
            // Show the add expenses stage
            self.showElm(self.addExpensesStage);
            return self;

        }

        bindInitialUI() {
            return this.applyDOMHooks().setInitialView().bindExpenseEvents(); // Returns this after bindExpenseEvents
        }

        renderData() {
            var self = this,
                incomeOutput = [],
                expenseOutput = [];

            function databindResultRow(data, key) {
                // Capitalize first letter of each key in data-obj
                return `<h1>${key[0].toUpperCase()}${key.substring(1, key.length)}</h1><span>${data[key]}</span>`;
            }

            function generateIncomeTemplate() {
                incomeOutput.push(`<div><h1 class="budget-calc--income-title">Income</h1><ul>`);
                for (var recurance in self.incomeBreakdown)
                    if (self.incomeBreakdown.hasOwnProperty(recurance)) incomeOutput.push(`<li class="budget-calc--income-item">${databindResultRow(self.incomeBreakdown, recurance)}</li>`);
                incomeOutput.push(`</ul></div></section>`);
                self.incomeList.innerHTML = incomeOutput.join('');
            }

            function generateExpenseTemplate() {
                expenseOutput.push(`<div>
												<h1 class="budget-calc--expense-title">Expenses</h1>
												<ul>`);

                for (var expensesInterval in self.expenses) {
                    if (!self.expenses.hasOwnProperty(expensesInterval)) return;
                    // If there are any items inside of any of the expense recurance arrays that have items in them
                    if (Array.isArray(self.expenses[expensesInterval]) && self.expenses[expensesInterval].length) {
                        self.showElm(self.expensesList);
                        if (self.expenses[expensesInterval]) self.expenses[expensesInterval].forEach(function(expense, idx) {
                            self.each(expense, function(val, name) {
                                expenseOutput.push(`<li class="budget-calc--expense-item">
																<button class="budg-calc--expense-delete" data-expense-delete value="${expensesInterval},${idx}">Delete</button>
																<div>${databindResultRow(expense, name)}</div>
																<div class="budg-calc--expense-interval">Deducted ${expensesInterval}</span></li>`);
                            });
                        });
                    }
                }
                expenseOutput.push(`</ul>
									</div>`);

                self.expensesList.innerHTML = expenseOutput.join('');

                function deleteExpense() {
                    var vals = this.value.split(','),
                        recurance = vals[0],
                        index = vals[1],
                        billToRemove = self.expenses[recurance][index],
                        amount;

                    for (var key in billToRemove)
                        if (billToRemove.hasOwnProperty(key)) amount = self.dollarsToCents(billToRemove[key]); // Get the amount of the expense being removed
                    self.income = self.income + (amount * self.dateData[recurance.toUpperCase()]); // Add the calculated amount back the total income
                    self.expenses[recurance].splice(index, 1); // Remove the selected expense from the budget
                    self.setAmountsAvailableByTimePeriod(); // Recalculate the income breakdown
                    // self.getExpenses(function(val, name, expensesInterval){
                    // 	console.log(val, name, expensesInterval);
                    // });

                    self.renderData(); // Repaint screen with new data
                }

                self.getNodes(self.selectors.add.delete).forEach(function(node) {
                    node.addEventListener('click', deleteExpense);
                });
            }

            generateIncomeTemplate(); // Will have data to work for first view, shows the default based off of salary

            if (self.expensesAdded) generateExpenseTemplate();

            return this;
        }

        bindExpenseEvents() {
            var self = this;

            function resetInputs() {
                self.expenseName.value = '';
                self.expenseAmount.value = '';
            }

            function captureExpenseValues(event) {
                event.preventDefault();
                this.addExpense(this.expenseName.value, this.expenseRecurance.value, this.expenseAmount.value);
                resetInputs();
                this.renderData();
            }

            this.addExpenseBtn.addEventListener('click', function(event) {
                captureExpenseValues.call(self, event);
            });

            return this;
        }

        create(target) {
            this.targetSelector = target;
            this.target = this.getNodes(target)[0];
            if (!this.stylesAdded) {
                // Inject styles to head of document
                this.getNodes('head')[0].innerHTML += this.templates.moduleStyles();
                this.stylesAdded = true;
            }
            // Write initial
            this.target.innerHTML = this.templates.initialUI();
            return this;
        }

    }

    window.loadBudgetCalc = function(target) {
        new renderUI().init().create(target).bindInitialUI();
    };

})();

loadBudgetCalc('body');